'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Merchant extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.hasMany(models.Transaction, { foreignKey: 'merchantId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
      this.belongsTo(models.Operator, { foreignKey: 'operatorId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
    }
  }
  Merchant.init({
    operatorId: DataTypes.INTEGER,
    subcategoryId: DataTypes.INTEGER,
    activity: DataTypes.INTEGER,
    isActive: DataTypes.BOOLEAN,
    name: DataTypes.STRING,
    phone: DataTypes.STRING,
    address: DataTypes.STRING,
    cni: DataTypes.STRING,
    rccm: DataTypes.STRING,
    password: DataTypes.STRING,
    qrcode: DataTypes.STRING,
    token: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Merchant',
  });
  return Merchant;
};