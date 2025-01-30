import { Router } from "express";
import categoryRepository from "../repositories/categoryRepository";
import { CategoryService } from "../services/categoryService";
import { CategoryController } from "../controllers/categoryController";

const categoryService = new CategoryService(categoryRepository);
const categoryController = new CategoryController(categoryService);

const router = Router();

router.post('/create-category', categoryController.createCategory.bind(categoryController));
router.get('/category/:categoryId', categoryController.getCategory.bind(categoryController));
router.get('/categories', categoryController.getCategories.bind(categoryController));
router.put('/update-category/:categoryId', categoryController.updateCategory.bind(categoryController));
router.put('/delete-category/:categoryId', categoryController.deleteCategory.bind(categoryController));

export default router;