const math = require('mathjs');

// Function to evaluate an expression using the provided variables.
// This matches the behavior of evaluateFullExpression in PHP.
function evaluateFullExpression(db, expression, measurements, age, gender, formulaId = null) {
  return new Promise((resolve, reject) => {
    // Collect variables
    const variables = {
      EDAD: age,
      SEXO: gender,
      ...measurements
    };

    // Replace variables in expression
    let finalExpr = expression;

    // We need to fetch constant groups
    db.all('SELECT id, name FROM constant_groups', [], (err, groups) => {
      if (err) return reject(err);

      let groupMap = {};
      groups.forEach(g => {
        groupMap[g.name] = g.id;
      });

      // Find references to matrices: format like MatrixName
      // We will do a simple regex replacement if MatrixName exists in the string and is a known group

      const evaluateWithMatrices = async () => {
        try {
            for (const [name, id] of Object.entries(groupMap)) {
                // If the matrix name is used in the expression, we need its value
                const regex = new RegExp(`\\b${name}\\b`, 'g');
                if (regex.test(finalExpr)) {
                     // Query for the specific value
                     const val = await new Promise((res, rej) => {
                        let query = `
                            SELECT value FROM constant_values
                            WHERE group_id = ?
                        `;
                        let params = [id];

                        // Add gender filter
                        if (gender) {
                             query += ` AND (gender = ? OR gender IS NULL OR gender = '')`;
                             params.push(gender);
                        } else {
                             query += ` AND (gender IS NULL OR gender = '')`;
                        }

                        // Add age filter
                        query += ` AND (age_min IS NULL OR age_min <= ?)`;
                        query += ` AND (age_max IS NULL OR age_max >= ?)`;
                        params.push(age, age);

                        // Prioritize most specific
                        query += ` ORDER BY gender DESC, age_min DESC LIMIT 1`;

                        db.get(query, params, (err, row) => {
                            if (err) return rej(err);
                            res(row ? row.value : 1); // Default to 1 if not found to avoid div by zero, or maybe throw error
                        });
                     });

                     variables[name] = val;
                }
            }

            // Also need to support nested formulas? The prompt said "resultado de otra fórmula".
            // For now, if there's a reference to another formula, we evaluate it.
            // But doing that recursively is complex. Let's do a basic pass if another formula is referenced by name.
            const formulas = await new Promise((res, rej) => {
               db.all('SELECT id, name, expression FROM formulas', [], (err, rows) => {
                   if (err) return rej(err);
                   res(rows);
               });
            });

            // Very simple approach for nested formulas
            for (const f of formulas) {
                // don't self reference
                if (f.id === formulaId) continue;

                const regex = new RegExp(`\\b${f.name}\\b`, 'g');
                if (regex.test(finalExpr)) {
                    // Evaluate the sub-formula
                    const subRes = await evaluateFullExpression(db, f.expression, measurements, age, gender, f.id);
                    variables[f.name] = subRes;
                }
            }

            // Replace max/min mathjs handles them.
            // Replace pow
            finalExpr = finalExpr.replace(/pow\(([^,]+),\s*([^\)]+)\)/g, '($1 ^ $2)');

            const result = math.evaluate(finalExpr, variables);
            resolve(result);
        } catch (e) {
            reject(e);
        }
      };

      evaluateWithMatrices();
    });
  });
}

module.exports = { evaluateFullExpression };
