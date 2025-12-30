import pool from './src/database/connection';

async function deleteAllUsers() {
  try {
    // Delete all users
    const deleteUsersQuery = 'DELETE FROM users;';
    await pool.query(deleteUsersQuery);
    console.log('All users deleted successfully');

    // Also delete related refresh tokens
    const deleteTokensQuery = 'DELETE FROM refresh_tokens;';
    await pool.query(deleteTokensQuery);
    console.log('All refresh tokens deleted successfully');

    console.log('Database cleanup completed');
  } catch (error) {
    console.error('Error deleting users:', error);
  } finally {
    await pool.end();
  }
}

deleteAllUsers();