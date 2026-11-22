export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly passwordHash: string,
    public readonly name: string,
    public readonly role: string,
    public readonly createdAt: Date,
  ) {}

  static create(
    id: string,
    email: string,
    passwordHash: string,
    name: string,
    role = 'customer',
  ): User {
    return new User(id, email, passwordHash, name, role, new Date());
  }
}
