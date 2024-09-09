const express = require('express');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { getDbPool } = require('../db');

const router = express.Router();

// POST endpoint to create a new user and send an email
router.post('/', async (req, res) => {
    const { email, name, password, role, temppass } = req.body;

    if (!email || !name || !password || !role) {
        return res.status(400).send('All fields must be provided');
    }

    try {
        // Fetch database connection from pool
        const pool = await getDbPool();  // Ensure this returns the proper DB connection
        const client = await pool.connect();

        console.log('Connected to the database');

        // Check if the user already exists
        const userCheck = await client.query('SELECT * FROM login WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            console.log('User with this email already exists');
            client.release();  // Release client on early return
            return res.status(409).send('User with this email already exists');
        }

        // Hash the password before saving it
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('Password hashed successfully');

        // Insert the new user into the database
        const insertQuery = `
            INSERT INTO login (email, name, password, role, temppass) 
            VALUES ($1, $2, $3, $4, $5) RETURNING id
        `;
        const result = await client.query(insertQuery, [email, name, hashedPassword, role, temppass]);

        console.log('New user added:', result.rows[0].id);

        client.release();  // Release the DB client after query execution

        // Send email invitation to the new user
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_PORT == 465,  // SSL for port 465, otherwise TLS
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        const mailOptions = {
            from: process.env.SMTP_USER,  // Sender email from environment variables
            to: email,  // Send to the new user's email
            subject: `You have been invited to 365 EasyFlow as a ${role}`,
            html: `
                <h3>Welcome to 365 EasyFlow, ${name}!</h3>
                <p>To log in, go to <a href="https://douglas.365easyflow.com">https://douglas.365easyflow.com</a>.</p>
                <p>Use your email and the temporary password: <b>${password}</b>.</p>
                <p>Once logged in, you will be prompted to create a new password.</p>
            `
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).send('User created but failed to send email');
            } else {
                console.log('Email sent:', info.response);
                return res.status(201).json({ userId: result.rows[0].id, message: 'User created and email sent' });
            }
        });
    } catch (error) {
        console.error('Error during user creation:', error);
        return res.status(500).send('Error creating new user');
    }
});

module.exports = router;
