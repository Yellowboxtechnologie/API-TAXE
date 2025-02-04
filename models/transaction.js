'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Transaction extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.Merchant, { foreignKey: 'merchantId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
      this.belongsTo(models.Operator, { foreignKey: 'operatorId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
      this.belongsTo(models.PaymentMethod, { foreignKey: 'paymentId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
    }
  }
  Transaction.init({
    merchantId: DataTypes.INTEGER,
    operatorId: DataTypes.INTEGER,
    paymentId: DataTypes.INTEGER,
    ticket: DataTypes.STRING,
    amount: DataTypes.DOUBLE
  }, {
    sequelize,
    modelName: 'Transaction',
  });
  return Transaction;
};