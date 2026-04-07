const { readStore, updateStore, createId, now } = require('../config/fileStore');

class FileRepository {
  constructor(collectionName) {
    this.collectionName = collectionName;
  }

  async getCollection() {
    const store = await readStore();
    return [...(store[this.collectionName] || [])];
  }

  normalizeRecord(record) {
    if (!record) {
      return record;
    }

    return { ...record };
  }

  matchesWhere(record, where = {}) {
    return Object.entries(where).every(([key, value]) => {
      if (value === null) {
        return record[key] === null || record[key] === undefined;
      }

      if (Array.isArray(value)) {
        return value.includes(record[key]);
      }

      if (typeof value === 'object' && value && value.operator) {
        switch (value.operator) {
          case '>=':
            return record[key] >= value.value;
          case '<=':
            return record[key] <= value.value;
          case '>':
            return record[key] > value.value;
          case '<':
            return record[key] < value.value;
          default:
            return record[key] === value.value;
        }
      }

      return record[key] === value;
    });
  }

  matchesArrayOverlap(record, arrayOverlap = {}) {
    return Object.entries(arrayOverlap).every(([key, values]) => {
      if (!Array.isArray(values) || values.length === 0) {
        return true;
      }

      const source = Array.isArray(record[key]) ? record[key] : [];
      return values.some(value => source.includes(value));
    });
  }

  matchesSearch(record, search = '') {
    if (!search) {
      return true;
    }

    const needle = String(search).toLowerCase();
    const haystacks = [
      record.title,
      record.description,
      ...(Array.isArray(record.topics) ? record.topics : [])
    ]
      .filter(Boolean)
      .map(value => String(value).toLowerCase());

    return haystacks.some(value => value.includes(needle));
  }

  sortRecords(records, orderBy = { created_at: 'DESC' }) {
    const [[field, direction]] = Object.entries(orderBy);
    const modifier = String(direction).toUpperCase() === 'ASC' ? 1 : -1;

    return [...records].sort((a, b) => {
      const aValue = a[field] ?? null;
      const bValue = b[field] ?? null;

      if (aValue === bValue) {
        return 0;
      }

      if (aValue === null) {
        return 1;
      }

      if (bValue === null) {
        return -1;
      }

      return aValue > bValue ? modifier : -modifier;
    });
  }

  selectColumns(record, select = ['*']) {
    const normalized = this.normalizeRecord(record);

    if (select.length === 1 && select[0] === '*') {
      return normalized;
    }

    return select.reduce((acc, key) => {
      acc[key] = normalized[key];
      return acc;
    }, {});
  }

  async findAll(options = {}) {
    const {
      where = {},
      arrayOverlap = {},
      search = '',
      select = ['*'],
      orderBy = { created_at: 'DESC' },
      limit = 20,
      offset = 0
    } = options;

    const collection = await this.getCollection();
    const filtered = collection
      .filter(record => this.matchesWhere(record, where))
      .filter(record => this.matchesArrayOverlap(record, arrayOverlap))
      .filter(record => this.matchesSearch(record, search));

    const sorted = this.sortRecords(filtered, orderBy);
    return sorted.slice(offset, offset + limit).map(record => this.selectColumns(record, select));
  }

  async findOne(where, select = ['*']) {
    const results = await this.findAll({ where, select, limit: 1, offset: 0 });
    return results[0] || null;
  }

  async findById(id, select = ['*']) {
    return this.findOne({ id }, select);
  }

  async count(where = {}, arrayOverlap = {}, search = '') {
    const collection = await this.getCollection();
    return collection
      .filter(record => this.matchesWhere(record, where))
      .filter(record => this.matchesArrayOverlap(record, arrayOverlap))
      .filter(record => this.matchesSearch(record, search))
      .length;
  }

  async create(data, returning = ['*']) {
    const timestamp = now();
    const record = {
      id: data.id || createId(),
      ...data,
      created_at: data.created_at || timestamp,
      updated_at: data.updated_at || timestamp
    };

    await updateStore(store => {
      store[this.collectionName] = store[this.collectionName] || [];
      store[this.collectionName].push(record);
      return record;
    });

    return this.selectColumns(record, returning);
  }

  async update(where, data, returning = ['*']) {
    const updatedRecords = [];

    await updateStore(store => {
      const collection = store[this.collectionName] || [];
      store[this.collectionName] = collection.map(record => {
        if (!this.matchesWhere(record, where)) {
          return record;
        }

        const updatedRecord = {
          ...record,
          ...data,
          updated_at: now()
        };

        updatedRecords.push(updatedRecord);
        return updatedRecord;
      });

      return updatedRecords;
    });

    return updatedRecords.map(record => this.selectColumns(record, returning));
  }

  async updateById(id, data, returning = ['*']) {
    const results = await this.update({ id }, data, returning);
    return results[0] || null;
  }

  async delete(where, returning = ['*']) {
    const deletedRecords = [];

    await updateStore(store => {
      const collection = store[this.collectionName] || [];
      store[this.collectionName] = collection.filter(record => {
        if (this.matchesWhere(record, where)) {
          deletedRecords.push(record);
          return false;
        }

        return true;
      });

      return deletedRecords;
    });

    return deletedRecords.map(record => this.selectColumns(record, returning));
  }

  async deleteById(id, returning = ['*']) {
    const results = await this.delete({ id }, returning);
    return results[0] || null;
  }

  async exists(where) {
    return (await this.count(where)) > 0;
  }

  async paginate(options = {}) {
    const {
      page = 1,
      limit = 20,
      ...queryOptions
    } = options;

    const offset = (page - 1) * limit;
    const [items, totalCount] = await Promise.all([
      this.findAll({ ...queryOptions, limit, offset }),
      this.count(queryOptions.where || {}, queryOptions.arrayOverlap || {}, queryOptions.search || '')
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit) || 1,
        totalCount,
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      }
    };
  }

  async raw() {
    throw new Error(`Raw queries are not supported for ${this.collectionName} in file storage mode`);
  }
}

module.exports = FileRepository;

// Made with Bob
