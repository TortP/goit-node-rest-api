import { DataTypes } from 'sequelize';
import sequelize from '../db/sequelize.js';

const Contact = sequelize.define(
  'contact',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    favorite: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    owner: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: 'contacts',
    timestamps: false,
  }
);
export default Contact;
