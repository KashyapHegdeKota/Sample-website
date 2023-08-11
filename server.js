const date = new Date();
const express = require("express");
const app = express();
const session = require("express-session");
const path = require("path");
var count = 0;

let day = date.getDay();
let days = date.getDate();
let month = date.getMonth() + 1;
let year = date.getFullYear();
let hours = date.getHours();
let minutes = date.getMinutes();
let seconds = date.getSeconds();
let mili = date.getMilliseconds();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(express.static(path.join(__dirname, "public")));

// In-memory user storage
const users = [
  { username: "admin", password: "password", leaves: 15, role: "admin" },
  { username: "kkhegde", password: "1234", leaves: 40, role: "user" },
];

// Authentication middleware
const authenticateUser = (req, res, next) => {
  if (req.session && req.session.isAuthenticated) {
    // Route to import employees from Excel sheet
    app.post("/api/import-employees", authenticateUser, (req, res) => {
      const { file } = req.files;

      // Check if the file is an Excel file
      if (
        !file.type.match(
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
      ) {
        res
          .status(415)
          .json({ success: false, message: "File is not an Excel file" });
        return;
      }

      // Read the Excel file data
      const data = file.data;

      // Parse the Excel file data into an array of employees
      const employees = [];
      for (const row of data) {
        if (row.length === 0) {
          break;
        }

        const employee = {
          name: row[0],
          timings: row[1],
        };
        employees.push(employee);
      }

      // Add the employees to the user storage
      users.push(...employees);

      // Notify the user that the import was successful
      res.json({ success: true });
    });

    // User is authenticated, proceed
    next();
  } else {
    // User is not authenticated, redirect to login page
    res.redirect("/login.html");
  }
};

// Create a middleware to check if the user is an admin

const isAdmin = (req, res, next) => {
  // Check if the user is authenticated
  if (req.session && req.session.isAuthenticated) {
    // Get the username from the session
    const username = req.session.username;

    // Replace this condition with your actual logic to check if the user is an admin
    if (username === "admin") {
      // User is an admin, proceed to the next middleware or route handler
      console.log("User is an admin. Proceeding to the admin dashboard.");
      next();
    } else {
      // User is not an admin, return a forbidden response (403)
      res.status(403).send("Forbidden - Access denied.");
    }
  } else {
    // User is not authenticated, redirect to login page
    res.redirect("/login.html");
  }
};

// Define the login route
app.post("/api/login", (req, res) => {
  // Handle login authentication logic here
  const { username, password } = req.body;
  console.log("Received login request:", { username, password });

  // Perform authentication checks (replace with your own logic)
  if (username === "admin" && password === "password") {
    // Set session and mark user as authenticated
    req.session.isAuthenticated = true;
    req.session.username = username;
    res.status(200).json({ success: true });
    return;
  }
  // Find the user in the users array
  const user = users.find(
    (user) => user.username === username && user.password === password
  );
  if (user) {
    console.log("User login successful");
    // Set session and mark user as authenticated
    req.session.isAuthenticated = true;
    req.session.username = username;
    res.status(200).json({ success: true });
  } else {
    console.log("Login failed: Invalid username or password");
    res
      .status(401)
      .json({ success: false, message: "Invalid username or password" });
  }
});
app.get("/admin", isAdmin, (req, res) => {
  console.log("Rendering admin dashboard.");
  console.log("User session:", req.session);
  res.sendFile(path.join(__dirname, "public", "admin-dashboard.html"));
});
app.get("/dashboard", authenticateUser, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// Create a middleware to check if the user is not an admin (i.e., a regular user)
/*

const isRegularUser = (req, res, next) => {
  // Check if the user is authenticated
  if (req.session && req.session.isAuthenticated) {
    // Get the username from the session
    const username = req.session.username;

    // Replace this condition with your actual logic to check if the user is not an admin
    if (username !== "admin") {
      // User is a regular user, proceed to the next middleware or route handler
      console.log("User is not an admin. Proceeding to regular dashboard.");
      res.redirect("/dashboard");
      next();
    } else {
      // User is an admin, proceed to the admin dashboard
      console.log("User is an admin. Proceeding to admin dashboard.");
      res.redirect("/admin");
    }
  } else {
    // User is not authenticated, redirect to login page
    res.redirect("/login.html");
  }
};
*/

// Define the registration route
app.post("/api/register", (req, res) => {
  // Handle user registration logic here
  const { username, password, confirmPassword } = req.body;

  console.log("Received registration request:", {
    username,
    password,
    confirmPassword,
  });

  // Check if the username is already taken
  const userExists = users.some((user) => user.username === username);
  if (userExists) {
    console.log("Registration failed: Username already exists");
    res
      .status(409)
      .json({ success: false, message: "Username already exists" });
  } else if (password !== confirmPassword) {
    console.log("Registration failed: Passwords do not match");
    res.status(400).json({ success: false, message: "Passwords do not match" });
  } else {
    // Create a new user and add it to the user storage
    const newUser = { username, password, leaves: 0, role: "user" };
    users.push(newUser);
    console.log("Registration successful:", newUser);

    // Set session and mark user as authenticated
    req.session.isAuthenticated = true;
    req.session.username = username;
    res.status(201).json({ success: true });
  }
});

// Route to view user details for admin
app.get("/admin/users", isAdmin, (req, res) => {
  res.json({
    success: true,
    users: users.filter((user) => user.role === "user"),
  });
});

// Route to add leaves for a user (admin only)
app.post("/admin/users/:username/leaves", isAdmin, (req, res) => {
  const { username } = req.params;
  const { leaves } = req.body;
  const user = users.find((user) => user.username === username);
  if (user) {
    user.leaves += leaves;
    res.json({ success: true, leaves: user.leaves });
  } else {
    res.status(404).json({ success: false, message: "User not found" });
  }
});

app.get("/api/leaves", authenticateUser, (req, res) => {
  const username = req.session.username;
  const user = users.find((user) => user.username === username);
  if (user) {
    res.json({ success: true, leaves: user.leaves });
  } else {
    res.status(404).json({ success: false, message: "User not found" });
  }
});

// Protected dashboard route
app.get("/dashboard", authenticateUser, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});
app.get("/logout", authenticateUser, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});
app.get("/leaves", authenticateUser, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "leaves.html"));
});
app.get("/calendar", authenticateUser, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "calendar.html"));
});
app.get("/reports", authenticateUser, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "reports.html"));
});
// Default route handler
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Date: ${days}-${month}-${year}`);
  console.log(`Time: ${hours}:${minutes}:${seconds}:${mili}`);
  console.log(`Server is running on port http://localhost:${port}/`);
});
