export class UserModel {
    static tableName = 'users';
    static primaryKey = 'user_id';
    static schema = {
        user_id: { type: 'int8', primary: true, identity: true },
        created_at: { type: 'timestamptz', nullable: true },
        username: { type: 'text', nullable: false, unique: true },
        email: { type: 'text', nullable: false },
        google_client_id: { type: 'text', nullable: true }
    };

    constructor({
        user_id = null,
        created_at = null,
        username = null,
        email = null,
        google_client_id = null
    } = {}) {
        this.user_id = user_id;
        this.created_at = created_at;
        this.username = username;
        this.email = email;
        this.google_client_id = google_client_id;
    }

    static fromRow(row = {}) {
        return new UserModel(row);
    }

    toRow() {
        return {
            ...(this.user_id !== null ? { user_id: this.user_id } : {}),
            ...(this.created_at !== null ? { created_at: this.created_at } : {}),
            username: this.username,
            email: this.email,
            ...(this.google_client_id !== null ? { google_client_id: this.google_client_id } : {})
        };
    }
}