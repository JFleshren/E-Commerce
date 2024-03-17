const router = require('express').Router();
const { Product, Category, Tag, ProductTag } = require('../../models');

// The `/api/products` endpoint

// GET all products
router.get('/', async (req, res) => {
  try {
    const productsData = await Product.findAll({
      include: [
        { model: Category },
        { model: Tag, through: ProductTag },
      ],
    });
    res.status(200).json(productsData);
  } catch (err) {
    res.status(500).json(err);
  }
});

// GET a single product by its `id`
router.get('/:id', async (req, res) => {
  try {
    const productData = await Product.findByPk(req.params.id, {
      include: [
        { model: Category },
        { model: Tag, through: ProductTag },
      ],
    });

    if (!productData) {
      res.status(404).json({ message: 'No product found with this id' });
      return;
    }

    res.status(200).json(productData);
  } catch (err) {
    res.status(500).json(err);
  }
});

// CREATE a new product
router.post('/', async (req, res) => {
  try {
    const newProduct = await Product.create(req.body);
    if (req.body.tagIds && req.body.tagIds.length) {
      const productTagIdArr = req.body.tagIds.map((tag_id) => {
        return {
          product_id: newProduct.id,
          tag_id,
        };
      });
      await ProductTag.bulkCreate(productTagIdArr);
    }
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(400).json(err);
  }
});

// UPDATE a product by its `id`
router.put('/:id', async (req, res) => {
  try {
    await Product.update(req.body, {
      where: { id: req.params.id },
    });

    const productTags = await ProductTag.findAll({ where: { product_id: req.params.id } });

    const newProductTags = req.body.tagIds.map((tag_id) => {
      return {
        product_id: req.params.id,
        tag_id,
      };
    });

    const removedProductTags = productTags.filter((tag) => !req.body.tagIds.includes(tag.tag_id));

    await ProductTag.bulkCreate(newProductTags);
    await ProductTag.destroy({ where: { id: removedProductTags.map((tag) => tag.id) } });

    res.status(200).json({ message: 'Product updated successfully' });
  } catch (err) {
    res.status(400).json(err);
  }
});

// DELETE a product by its `id`
router.delete('/:id', async (req, res) => {
  try {
    await Product.destroy({ where: { id: req.params.id } });
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
