'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Authentication extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.Merchant, { foreignKey: 'merchantId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
      this.belongsTo(models.Operator, { foreignKey: 'operatorId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
    }
  }
  Authentication.init({
    merchantId: DataTypes.INTEGER,
    operatorId: DataTypes.INTEGER,
    code: DataTypes.INTEGER,
    isUsed: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Authentication',
  });
  return Authentication;
};