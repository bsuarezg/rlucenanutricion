<?php
require_once 'db.php';
require_once 'auth.php';

$user = authenticate();
if (!$user) {
    exit();
}

$db = getDB();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $id = isset($_GET['id']) ? intval($_GET['id']) : null;

    if ($id) {
        $stmt = $db->prepare('SELECT * FROM constant_groups WHERE id = :id');
        $stmt->bindValue(':id', $id, SQLITE3_INTEGER);
        $result = $stmt->execute();
        $group = $result->fetchArray(SQLITE3_ASSOC);

        if ($group) {
            $vStmt = $db->prepare('SELECT * FROM constant_values WHERE group_id = :group_id ORDER BY gender, age_min');
            $vStmt->bindValue(':group_id', $id, SQLITE3_INTEGER);
            $vResult = $vStmt->execute();
            $values = [];
            while ($row = $vResult->fetchArray(SQLITE3_ASSOC)) {
                $values[] = $row;
            }
            $group['values'] = $values;
            echo json_encode($group, JSON_UNESCAPED_UNICODE);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Constant group not found'], JSON_UNESCAPED_UNICODE);
        }
    } else {
        $result = $db->query('SELECT * FROM constant_groups ORDER BY name ASC');
        $groups = [];
        while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
            // Also fetch values
            $vStmt = $db->prepare('SELECT * FROM constant_values WHERE group_id = :group_id ORDER BY gender, age_min');
            $vStmt->bindValue(':group_id', $row['id'], SQLITE3_INTEGER);
            $vResult = $vStmt->execute();
            $values = [];
            while ($vRow = $vResult->fetchArray(SQLITE3_ASSOC)) {
                $values[] = $vRow;
            }
            $row['values'] = $values;
            $groups[] = $row;
        }
        echo json_encode($groups, JSON_UNESCAPED_UNICODE);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['name'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Name is required'], JSON_UNESCAPED_UNICODE);
        exit();
    }

    $db->exec('BEGIN TRANSACTION');
    try {
        $stmt = $db->prepare('INSERT INTO constant_groups (name) VALUES (:name)');
        $stmt->bindValue(':name', $data['name'], SQLITE3_TEXT);
        $stmt->execute();
        $groupId = $db->lastInsertRowID();

        if (isset($data['values']) && is_array($data['values'])) {
            $vStmt = $db->prepare('
                INSERT INTO constant_values (group_id, gender, age_min, age_max, value)
                VALUES (:group_id, :gender, :age_min, :age_max, :value)
            ');
            foreach ($data['values'] as $val) {
                $vStmt->bindValue(':group_id', $groupId, SQLITE3_INTEGER);
                $vStmt->bindValue(':gender', isset($val['gender']) ? $val['gender'] : null, SQLITE3_TEXT);
                $vStmt->bindValue(':age_min', isset($val['age_min']) ? $val['age_min'] : null, SQLITE3_INTEGER);
                $vStmt->bindValue(':age_max', isset($val['age_max']) ? $val['age_max'] : null, SQLITE3_INTEGER);
                $vStmt->bindValue(':value', $val['value'], SQLITE3_FLOAT);
                $vStmt->execute();
            }
        }
        $db->exec('COMMIT');

        echo json_encode([
            'id' => $groupId,
            'name' => $data['name'],
            'values' => isset($data['values']) ? $data['values'] : []
        ]);
    } catch (Exception $e) {
        $db->exec('ROLLBACK');
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $id = isset($_GET['id']) ? intval($_GET['id']) : null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID is required'], JSON_UNESCAPED_UNICODE);
        exit();
    }

    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['name'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Name is required'], JSON_UNESCAPED_UNICODE);
        exit();
    }

    $db->exec('BEGIN TRANSACTION');
    try {
        $stmt = $db->prepare('UPDATE constant_groups SET name = :name WHERE id = :id');
        $stmt->bindValue(':id', $id, SQLITE3_INTEGER);
        $stmt->bindValue(':name', $data['name'], SQLITE3_TEXT);
        $stmt->execute();

        if (isset($data['values']) && is_array($data['values'])) {
            // Delete old values
            $delStmt = $db->prepare('DELETE FROM constant_values WHERE group_id = :group_id');
            $delStmt->bindValue(':group_id', $id, SQLITE3_INTEGER);
            $delStmt->execute();

            // Insert new values
            $vStmt = $db->prepare('
                INSERT INTO constant_values (group_id, gender, age_min, age_max, value)
                VALUES (:group_id, :gender, :age_min, :age_max, :value)
            ');
            foreach ($data['values'] as $val) {
                $vStmt->bindValue(':group_id', $id, SQLITE3_INTEGER);
                $vStmt->bindValue(':gender', isset($val['gender']) ? $val['gender'] : null, SQLITE3_TEXT);
                $vStmt->bindValue(':age_min', isset($val['age_min']) ? $val['age_min'] : null, SQLITE3_INTEGER);
                $vStmt->bindValue(':age_max', isset($val['age_max']) ? $val['age_max'] : null, SQLITE3_INTEGER);
                $vStmt->bindValue(':value', $val['value'], SQLITE3_FLOAT);
                $vStmt->execute();
            }
        }
        $db->exec('COMMIT');

        echo json_encode([
            'id' => $id,
            'name' => $data['name'],
            'values' => isset($data['values']) ? $data['values'] : []
        ]);
    } catch (Exception $e) {
        $db->exec('ROLLBACK');
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $id = isset($_GET['id']) ? intval($_GET['id']) : null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID is required'], JSON_UNESCAPED_UNICODE);
        exit();
    }

    $stmt = $db->prepare('DELETE FROM constant_groups WHERE id = :id');
    $stmt->bindValue(':id', $id, SQLITE3_INTEGER);

    try {
        $stmt->execute();
        echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
}
