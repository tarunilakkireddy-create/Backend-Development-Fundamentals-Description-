
const express = require("express");
const { MongoClient } = require("mongodb");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();

app.use(express.json());

const PORT = 3000;
const MONGO_URL = "mongodb://127.0.0.1:27017";
const JWT_SECRET = "my_lab4_secret_key";

const client = new MongoClient(MONGO_URL);

async function startServer() {
    try {
        await client.connect();

        console.log("MongoDB connected successfully!");

        const db = client.db("lab4_auth");
        const users = db.collection("users");

        // Registration API
        app.post("/register", async (req, res) => {
            try {
                const { username, name, password } = req.body;

                if (!username || !name || !password) {
                    return res.status(400).json({
                        message: "Please enter all details"
                    });
                }

                const existingUser = await users.findOne({
                    username: username
                });

                if (existingUser) {
                    return res.status(400).json({
                        message: "Username already exists"
                    });
                }

                const hashedPassword = await bcrypt.hash(password, 10);

                await users.insertOne({
                    username: username,
                    name: name,
                    password: hashedPassword
                });

                res.status(201).json({
                    message: "Registration successful"
                });

            } catch (error) {
                console.log(error);
                res.status(500).json({
                    message: "Server error"
                });
            }
        });

        // Login API
        app.post("/login", async (req, res) => {
            try {
                const { username, password } = req.body;

                if (!username || !password) {
                    return res.status(400).json({
                        message: "Please enter username and password"
                    });
                }

                // Find user in database
                const user = await users.findOne({
                    username: username
                });

                if (!user) {
                    return res.status(400).json({
                        message: "User not found"
                    });
                }

                // Compare entered password with stored hash
                const isPasswordCorrect = await bcrypt.compare(
                    password,
                    user.password
                );

                if (!isPasswordCorrect) {
                    return res.status(400).json({
                        message: "Invalid password"
                    });
                }

                // Generate JWT token
                const token = jwt.sign(
                    { username: username },
                    JWT_SECRET
                );

                res.status(200).json({
                    jwt_token: token
                });

            } catch (error) {
                console.log(error);
                res.status(500).json({
                    message: "Server error"
                });
            }
        });

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

    } catch (error) {
        console.log("Error:", error);
    }
}

startServer();
