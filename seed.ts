import db from './src/db.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('123456', salt);

  const student = {
    id: uuidv4(),
    name: 'Estudiante Prueba',
    email: 'estudiante@eduplatform.com',
    password: passwordHash,
    role: 'student'
  };

  const teacher = {
    id: uuidv4(),
    name: 'Profesor Prueba',
    email: 'profesor@eduplatform.com',
    password: passwordHash,
    role: 'admin'
  };

  const insert = db.prepare('INSERT OR IGNORE INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)');

  insert.run(student.id, student.name, student.email, student.password, student.role);
  insert.run(teacher.id, teacher.name, teacher.email, teacher.password, teacher.role);

  console.log('Usuarios creados exitosamente:');
  console.log('Estudiante: estudiante@eduplatform.com / 123456');
  console.log('Profesor: profesor@eduplatform.com / 123456');
}

seed().catch(console.error);
