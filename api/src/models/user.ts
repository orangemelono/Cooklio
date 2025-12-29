import pool from '../database/connection';

export interface User {
  id: number;
  email: string;
  username: string;
  password_hash: string;
  first_name?: string;
  last_name?: string;
  is_verified: boolean;
  verification_code?: string;
  password_reset_code?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserInput {
  email: string;
  username: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

export interface UpdateUserInput {
  first_name?: string;
  last_name?: string;
  is_verified?: boolean;
  verification_code?: string;
  password_reset_code?: string;
}

export const UserModel = {
  create: async (userData: CreateUserInput): Promise<User> => {
    const { email, username, password, first_name, last_name } = userData;
    
    const query = `
      INSERT INTO users (email, username, password_hash, first_name, last_name)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const result = await pool.query(query, [email, username, password, first_name, last_name]);
    return result.rows[0];
  },

  findByEmail: async (email: string): Promise<User | null> => {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows.length ? result.rows[0] : null;
  },

  findById: async (id: number): Promise<User | null> => {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows.length ? result.rows[0] : null;
  },

  findByUsername: async (username: string): Promise<User | null> => {
    const query = 'SELECT * FROM users WHERE username = $1';
    const result = await pool.query(query, [username]);
    return result.rows.length ? result.rows[0] : null;
  },

  update: async (id: number, userData: UpdateUserInput): Promise<User | null> => {
    const fields: string[] = [];
    const values: any[] = [];
    let index = 2;

    Object.keys(userData).forEach(key => {
      fields.push(`${key} = $${index}`);
      values.push((userData as any)[key]);
      index++;
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    const query = `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`;
    const result = await pool.query(query, [id, ...values]);
    
    return result.rows.length ? result.rows[0] : null;
  },

  delete: async (id: number): Promise<boolean> => {
    const query = 'DELETE FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  },

  setVerificationCode: async (id: number, code: string): Promise<User | null> => {
    const query = 'UPDATE users SET verification_code = $2 WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id, code]);
    return result.rows.length ? result.rows[0] : null;
  },

  verifyUser: async (verificationCode: string): Promise<User | null> => {
    const query = 'UPDATE users SET is_verified = true, verification_code = NULL WHERE verification_code = $1 RETURNING *';
    const result = await pool.query(query, [verificationCode]);
    return result.rows.length ? result.rows[0] : null;
  },

  setPasswordResetCode: async (id: number, code: string): Promise<User | null> => {
    const query = 'UPDATE users SET password_reset_code = $2 WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id, code]);
    return result.rows.length ? result.rows[0] : null;
  },

  verifyPasswordResetCode: async (code: string): Promise<User | null> => {
    const query = 'SELECT * FROM users WHERE password_reset_code = $1';
    const result = await pool.query(query, [code]);
    return result.rows.length ? result.rows[0] : null;
  },

  clearPasswordResetCode: async (id: number): Promise<User | null> => {
    const query = 'UPDATE users SET password_reset_code = NULL WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows.length ? result.rows[0] : null;
  },
};