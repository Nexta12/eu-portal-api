import { Request, Response } from 'express';

import { BlogEntity, CategoryEntity } from '../entities';
import { logger } from '../services';
import { IExtendedRequest } from '../types/JwtPayload';
import { HTTP_STATUS, handleGetRepository } from '../utils';

export const getAllCategories = async (_: Request, res: Response) => {
    try {
        const categoryRepository = handleGetRepository(CategoryEntity);
        const categories = await categoryRepository.find();
        return res.status(HTTP_STATUS.OK.code).send(categories);
    } catch (error) {
        logger.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
    }
};

export const getOneCategory = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const categoryRepository = handleGetRepository(CategoryEntity);
        const category = await categoryRepository.findOneBy({ id });
        if (!category) {
            return res
                .status(HTTP_STATUS.NOT_FOUND.code)
                .send({ message: HTTP_STATUS.NOT_FOUND.message });
        }
        return res.status(HTTP_STATUS.OK.code).send({ message: HTTP_STATUS.OK.message, data: category });
    } catch (error) {
        logger.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
    }
};

export const createCategory = async (req: IExtendedRequest, res: Response) => {
    const { title } = req.body;

    try {
        const categoryRepository = handleGetRepository(CategoryEntity);

        const category = await categoryRepository.findOneBy({ title });

        if (category) {
            return res
                .status(HTTP_STATUS.CONFLICT.code)
                .send({ message: 'Category with given name already exist' });
        }

        const newCategory = categoryRepository.create({ title });

        await categoryRepository.save(newCategory);
        return res.status(HTTP_STATUS.CREATED.code).send({
            message: HTTP_STATUS.CREATED.message,
            data: {
                id: newCategory.id,
                title: newCategory.title
            }
        });
    } catch (error) {
        logger.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
    }
};

export const updateCategory = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { title } = req.body;
    const categoryRepository = handleGetRepository(CategoryEntity);

    try {
        const category = await categoryRepository.findOneBy({ id });
        if (!category) {
            return res
                .status(HTTP_STATUS.NOT_FOUND.code)
                .send({ message: HTTP_STATUS.NOT_FOUND.message });
        }

        await categoryRepository.update({ id }, { title });
        return res.status(HTTP_STATUS.OK.code).send({
            message: 'Category updated successfully',
            data: {
                id,
                title
            }
        });
    } catch (error) {
        logger.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
    }
};

export const deleteCategory = async (req: Request, res: Response) => {
    const { id } = req.params;
    const blogRepository = handleGetRepository(BlogEntity);
    const categoryRepository = handleGetRepository(CategoryEntity);

    try {
     
        // Find the category to delete
        const categoryToDelete = await categoryRepository.findOneBy({ id });
        if (!categoryToDelete) {
            return res.status(HTTP_STATUS.NOT_FOUND.code).send({ message: 'Category not found' });
        }

        // Update all blogs associated with the category to use the default category
        await blogRepository.createQueryBuilder()
            .update(BlogEntity)
            .set({ category: null })
            .where("categoryId = :id", { id })
            .execute();

        // Delete the category
        await categoryRepository.remove(categoryToDelete);

        return res.status(HTTP_STATUS.OK.code).send({ message: 'Category deleted and blogs updated to default category' });
    } catch (error) {
        logger.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
    }
};
