<?php
session_start();

$conn = new mysqli("localhost", "root", "", "testdb");
if ($conn->connect_error) {
    die("Database connection failed");
}

$message = "";

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    if (isset($_POST['login'])) {
        $username = trim($_POST['username']);
        $password = $_POST['password'];

        $stmt = $conn->prepare("SELECT password FROM users WHERE username=?");
        $stmt->bind_param("s", $username);
        $stmt->execute();
        $res = $stmt->get_result();

        if ($res->num_rows === 1) {
            $row = $res->fetch_assoc();
            if (password_verify($password, $row['password'])) {
                $_SESSION['user'] = $username;
                $message = "Login successful";
            } 
            else {
                $message = "Wrong password";
            }
        } 
        else {
            $message = "User not found";
        }
        $stmt->close();
    }
    
    if (isset($_POST['create_account'])) {
        $username = trim($_POST['username']);
        $email = trim($_POST['email']);
        $password = password_hash($_POST['password'], PASSWORD_DEFAULT);
        $check = $conn->prepare("SELECT id FROM users WHERE username=?");
        $check->bind_param("s", $username);
        $check->execute();
        $result = $check->get_result();

        if ($result->num_rows > 0) {
            $message = "Username already exists";
        }
        else {
            $insert = $conn->prepare("INSERT INTO users (username, email, password) VALUES (?,?, ?)");
            $insert->bind_param("sss", $username, $email, $password);
            if ($insert->execute()) {
                $message = "Account created successfully";
            }
             else {
                $message = "Account creation failed";
            }
        }
    }
}
?>

<!DOCTYPE html>
<html>
<head>
    <title>Login</title>
</head>
<body>
<h2>Login</h2>

<form method="post" action="">
    <input type="text" name="username" placeholder="Username" required><br><br>
    <input type="email" name="email" placeholder="Email" required><br><br>
    <input type="password" name="password" placeholder="Password" required><br><br>
    <button type="submit" name="login">Login</button>
    <button type="submit" name="create_account">Create account</button>
</form>

<?php if (!empty($message)) 
    echo "<p>$message</p>"; ?>

</body>
</html>
