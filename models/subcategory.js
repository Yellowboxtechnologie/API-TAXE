'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class SubCategory extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.Category, { foreignKey: 'categoryId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
      this.hasMany(models.Merchant, { foreignKey: 'subcategoryId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
    }
  }
  SubCategory.init({
    categoryId: DataTypes.INTEGER,
    name: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'SubCategory',
  });
  return SubCategory;
};