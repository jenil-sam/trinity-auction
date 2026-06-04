export class RefreshTokenModel {
    static tableName = 'refresh_tokens_duplicate';
    static primaryKey = 'token_id';
    static schema = {
        token_id: { type: 'int8', primary: true },
        user_id: { type: 'int8', nullable: false },
        token_hash: { type: 'text', nullable: false },
        expires_at: { type: 'timestamptz', nullable: false },
        created_at: { type: 'timestamptz', nullable: false },
        revoked: { type: 'bool', nullable: false }
    };

    constructor({
        token_id = null,
        user_id = null,
        token_hash = null,
        expires_at = null,
        created_at = null,
        revoked = false
    } = {}) {
        this.token_id = token_id;
        this.user_id = user_id;
        this.token_hash = token_hash;
        this.expires_at = expires_at;
        this.created_at = created_at;
        this.revoked = revoked;
    }

    static fromRow(row = {}) {
        return new RefreshTokenModel(row);
    }

    toRow() {
        return {
            ...(this.token_id !== null ? { token_id: this.token_id } : {}),
            ...(this.user_id !== null ? { user_id: this.user_id } : {}),
            token_hash: this.token_hash,
            ...(this.expires_at !== null ? { expires_at: this.expires_at } : {}),
            ...(this.created_at !== null ? { created_at: this.created_at } : {}),
            revoked: this.revoked
        };
    }
}
