// microservicio de authenticacion

import express from 'express'
import fs from 'fs'
import cors from 'cors'
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { firebaseConfig } from 'firebase-functions';




const app = express();
app.use(cors());
app.use(express.json()); // Middleware para parsear JSON
 // Middleware to handle OPTIONS requests
let USSERDATA = [];
// Función para leer la base de datos desde el archivo
const readUserDataBase = () => {
    try {
        const data = fs.readFileSync('./userDataBase.json', 'utf-8');
        USSERDATA = JSON.parse(data);
    } catch (error) {
        console.error('Error reading user database:', error);
        USSERDATA = [];
    }
};

// Función para escribir la base de datos al archivo

const writeUserDataBase = () => {
    try {
        fs.writeFileSync('./userDataBase.json', JSON.stringify(USSERDATA, null, 2));
    } catch (error) {
        console.error('Error writing user database:', error);
    }
};



const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'your-email@gmail.com',
        pass: 'your-email-password'
    }
});

const sendVerificationEmail = (email, token) => {
    const mailOptions = {
        from: 'your-email@gmail.com',
        to: email,
        subject: 'Email Verification',
        html: `<p>Click <a href="http://localhost:3000/verify-email?token=${token}">here</a> to verify your email.</p>`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });
};


export const authServices = (req, res) => {

     // Manejo de solicitudes OPTIONS
    /*if (req.method === 'OPTIONS') {
        console.log("hola")
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(204).send('');
    }*/
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  
    console.log("metodo",req.method)
    if (req.method === 'GET') {
       
        if (req.url.startsWith('/login')) {
            
            const { email, password } = req.query;
            if (!email || !password) {
                
                return res.status(400).send('Faltan datos');
            }

            try {
                // Leer base de datos de usuarios
                readUserDataBase();

                // Verificar las credenciales del usuario
                const user = USSERDATA.find(user => user.email === email && user.password === password);
                if (!user) {
                    console.log("credenciales invalidaas")
                    return res.status(400).json({message:'Credenciales inválidas'});
                }
                console.log('login nice')
                res.status(200).json({ message: 'Usuario logueado exitosamente', role: user.role, email:user.email });
            } catch (error) {
                console.error(error);
                res.status(500).send({message:'Error interno del servidor'});
            }
        }


        if (req.url.startsWith('/register')) {
           
            const { email, password, confirm } = req.query;
            if (!email || !password || !confirm) {
                console.log('faltan datos')
                return res.status(400).json({message:'Faltan datos'});

            }

            if (password !== confirm) {
              
                return res.status(400).json({message:'Las contraseñas no coinciden'});
            }

            try {
                // Leer base de datos de usuarios

                readUserDataBase();

                // Verificar si el usuario ya existe
                if (USSERDATA.find(user => user.email === email)) {
                    return res.status(400).json({message:'El usuario ya existe'});
                }
                const token = crypto.randomBytes(32).toString('hex');

                //fs.writeFileSync('./userbase.json', JSON.stringify(userDataBase, null, 2));

                const newUser = { email, password, role: 'user', verified:false, token }; // En un entorno real, asegúrate de hashear la contraseña
                USSERDATA.push(newUser);
                console.log('se creo un nuevo usuario')

                // Escribir la base de datos actualizada
                writeUserDataBase();

                res.status(201).json({ message: 'Usuario registrado exitosamente' });

            } catch (error) {
                console.error(error);
                res.status(500).json({message:'Error interno del servidor'});
            }
        }


    }


}



