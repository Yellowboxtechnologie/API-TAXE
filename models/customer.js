'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Customer extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.hasMany(models.Transaction, { foreignKey: 'customerId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
    }
  }
  Customer.init({
    uuid: DataTypes.STRING,
    isActive: DataTypes.BOOLEAN,
    name: DataTypes.STRING,
    phone: DataTypes.STRING,
    address: DataTypes.STRING,
    cni: DataTypes.STRING,
    rccm: DataTypes.STRING,
    activity: DataTypes.STRING,
    password: DataTypes.STRING,
    qrcode: DataTypes.STRING,
    token: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Customer',
  });
  return Customer;
};