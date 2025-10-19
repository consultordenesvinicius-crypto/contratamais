const fs = require('fs');
const path = require('path');

const DEFAULT_DATA = {
  messages: [],
  conversations: [],
};

class Database {
  constructor(filePath) {
    this.filePath = filePath;
    this.data = DEFAULT_DATA;
    this._load();
  }

  _load() {
    try {
      if (!fs.existsSync(this.filePath)) {
        this._persist(DEFAULT_DATA);
        this.data = JSON.parse(JSON.stringify(DEFAULT_DATA));
        return;
      }

      const raw = fs.readFileSync(this.filePath, 'utf-8');
      this.data = JSON.parse(raw);
    } catch (error) {
      console.error('Failed to load database file. Falling back to empty store.', error);
      this.data = JSON.parse(JSON.stringify(DEFAULT_DATA));
    }
  }

  _persist(data) {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
  }

  _save() {
    this._persist(this.data);
  }

  _generateId(prefix) {
    return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
  }

  createMessage(message) {
    const record = {
      id: this._generateId('msg'),
      createdAt: new Date().toISOString(),
      ...message,
    };

    this.data.messages.unshift(record);
    this._save();
    return record;
  }

  listMessages(limit = 50) {
    return this.data.messages.slice(0, limit);
  }

  listMessagesByConversation(conversationId) {
    return this.data.messages.filter((message) => message.conversationId === conversationId);
  }

  upsertConversation(conversation) {
    const existingIndex = this.data.conversations.findIndex((item) => item.id === conversation.id);
    const record = {
      updatedAt: new Date().toISOString(),
      ...conversation,
    };

    if (existingIndex >= 0) {
      this.data.conversations[existingIndex] = {
        ...this.data.conversations[existingIndex],
        ...record,
      };
    } else {
      if (!record.id) {
        record.id = this._generateId('conv');
      }
      record.createdAt = new Date().toISOString();
      this.data.conversations.unshift(record);
    }

    this._save();
    return record;
  }

  findConversationByPhone(phone) {
    return this.data.conversations.find((item) => item.phone === phone);
  }

  listConversations() {
    return this.data.conversations.slice();
  }
}

const databaseFile = path.join(__dirname, '..', 'data', 'database.json');

const db = new Database(databaseFile);

module.exports = db;
