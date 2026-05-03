import { NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';

// POST /api/auth/setup — Crear usuario admin inicial
// Solo funciona si NO existe ningún usuario en la base de datos
export async function POST(request: Request) {
  try {
    // Verificar si ya hay usuarios
    const existingUsers = await db.user.count();
    if (existingUsers > 0) {
      return NextResponse.json(
        { error: 'Ya existen usuarios registrados. Use el panel de administración.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nombre, email y contraseña son obligatorios' },
        { status: 400 }
      );
    }

    // Validar longitud de contraseña
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'admin',
      },
    });

    // No exponer el hash en la respuesta
    const { password: _pw, ...userSafe } = user;

    return NextResponse.json({
      message: 'Usuario admin creado exitosamente',
      user: userSafe,
    }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';

    if (message.includes('Unique')) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con ese email' },
        { status: 409 }
      );
    }

    console.error('Error creating admin user:', message);
    return NextResponse.json(
      { error: 'Error al crear usuario' },
      { status: 500 }
    );
  }
}
