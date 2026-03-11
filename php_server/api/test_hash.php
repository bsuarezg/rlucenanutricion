<?php
echo password_hash("Gilb3rt01+", PASSWORD_DEFAULT) . "\n";
echo password_verify("Gilb3rt01+", '$2y$10$akR2kq7pjM7bxtwzuzDxDuhS/8i13DZlYGAg.FmVAfxAfppv1zJ1O') ? "true" : "false";
echo "\n";
