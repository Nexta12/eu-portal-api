
import { Response } from 'express';
import { BlogEntity, CategoryEntity, StaffEntity } from '../entities';
import { logger } from '../services';
import { IExtendedRequest } from '../types/JwtPayload';
import { HTTP_STATUS, generateUniqueSlug, getSnippet, handleGetRepository, transformAuthor } from '../utils';
import { CLOUDINARY_BLOG_IMAGE_FOLDER } from '../middleware';
import cloudinaryClient from '../config/cloudinaryClient';




export const createBlog = async (req: IExtendedRequest, res: Response) => {
    const { title, content, category, blogImage } = req.body;
    const { userId } = req.jwtPayload;
    const blogRepository = handleGetRepository(BlogEntity);
    const staffRepository = handleGetRepository(StaffEntity);
    const categoryRepository = handleGetRepository(CategoryEntity);
    try {
        // Fetch the staff entity by userId
        const author = await staffRepository.findOne({ where: { userId } });
        if (!author) {
            return res.status(HTTP_STATUS.NOT_FOUND.code).send({ message: 'Author not found' });
        }

        // Fetch the category entity by title
        const categoryType = await categoryRepository.findOne({ where: { title: category } });

        const slug = await generateUniqueSlug(title)

        const snippet = getSnippet(content, 20)

        // Create the new blog with the author
        const newBlog = blogRepository.create({ title, content, category: categoryType, author, slug, blogImage, snippet });

        // Save the new blog post
        await blogRepository.save(newBlog);

        return res.status(HTTP_STATUS.CREATED.code).send({
            message: HTTP_STATUS.CREATED.message,
            data: {
                id: newBlog.id,
                title: newBlog.title,
                content: newBlog.content,
                author: userId,
                category: newBlog.category.title,
                blogImage: newBlog.blogImage
            }
        });

    } catch (error) {
        logger.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
    }
};

export const getAllBlogs = async (req: IExtendedRequest, res: Response) => {

    const blogRepository = handleGetRepository(BlogEntity);

    const pageSize = Number.parseInt(req.query.pageSize as string, 10) || 10;
    const page = Number.parseInt(req.query.page as string, 10) || 1;
    const category = req.query.category as string || '';

    try {
        const queryBuilder = blogRepository.createQueryBuilder('blog')
            .leftJoinAndSelect('blog.author', 'author')
            .leftJoinAndSelect('blog.category', 'category')
            .orderBy('blog.createdAt', 'DESC')
            .take(pageSize)
            .skip((page - 1) * pageSize);

        if (category) {
            queryBuilder.andWhere('category.name = :category', { category });
        }

        const blogs = await queryBuilder.getMany();

        const extractedAuthors = blogs.map(blog => ({
            ...blog,
            author: transformAuthor(blog.author)
        }));

        return res.status(HTTP_STATUS.OK.code).send(extractedAuthors);

    } catch (error) {
        logger.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
    }
};


export const getOneBlog = async (req: IExtendedRequest, res: Response) => {
    const { slug } = req.params;
    try {
        const blogRepository = handleGetRepository(BlogEntity);

        const blog = await blogRepository.findOne({ where: { slug }, relations: ['author', 'category'] });
        if (!blog) {
            return res
                .status(HTTP_STATUS.NOT_FOUND.code)
                .send({ message: HTTP_STATUS.NOT_FOUND.message });
        }

        const transformedBlog = {
            ...blog,
            author: transformAuthor(blog.author)
        };

        return res.status(HTTP_STATUS.OK.code).send({ data: transformedBlog });


    } catch (error) {
        logger.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
    }
};

async function deleteBlogImageFromCloudinary(imageUrl: string): Promise<void> {
    try {
        const imageId = imageUrl.split("/").pop()?.split(".")[0];
        if (imageId) {
            await cloudinaryClient.uploader.destroy(`${CLOUDINARY_BLOG_IMAGE_FOLDER}/${imageId}`);
        }
    } catch (error) {
        logger.error(error);
    }
}

export const editBlog = async (req: IExtendedRequest, res: Response) => {
    const { slug } = req.params;
    const blogRepository = handleGetRepository(BlogEntity);
    const { title, content } = req.body;
    const { userId, role } = req.jwtPayload;
    const { blogImage } = req.body.blogImage

    try {
        // Fetch the existing blog by slug
        const blog = await blogRepository.findOne({ where: { slug }, relations: ['author'] });

        if (!blog) {
            return res.status(HTTP_STATUS.NOT_FOUND.code).send({ message: 'Blog does not exist' });
        }

        // Check authorization
        if (userId !== blog.author.userId && role !== 'admin') {
            return res.status(HTTP_STATUS.FORBIDDEN.code).send({ message: 'You are not authorized' });
        }

        // Generate a new slug if the title has changed
        let newSlug = slug;
        if (title !== blog.title) {
            newSlug = await generateUniqueSlug(title);
        }
        if (blogImage !== blog.blogImage) {
            await deleteBlogImageFromCloudinary(blog.blogImage);
        }

        // Update the blog post
        await blogRepository.update({ slug }, { title, content, slug: newSlug });


        return res.status(HTTP_STATUS.OK.code).send({
            message: HTTP_STATUS.OK.message,
            data: {
                title,
                content,
                slug: newSlug // Include the new slug in the response
            }
        });

    } catch (error) {
        logger.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
    }
};

export const deleteBlog = async (req: IExtendedRequest, res: Response): Promise<Response> => {

    const { id } = req.params;
    const blogRepository = handleGetRepository(BlogEntity);

    const { userId, role } = req.jwtPayload;

    try {

        const blog = await blogRepository.findOne({ where: { id }, relations: ['author'] });

        if (!blog) {
            return res.status(HTTP_STATUS.NOT_FOUND.code).send({ message: 'Blog does not exist' });
        }

        if (userId !== blog.author.userId && role !== "admin") {
            return res.status(HTTP_STATUS.FORBIDDEN.code).send({ message: 'Your are not authorized' });
        }
        await deleteBlogImageFromCloudinary(blog.blogImage);

        await blogRepository.delete({ id });
        return res.status(HTTP_STATUS.OK.code).send({ message: HTTP_STATUS.OK.message });

    } catch (error) {
        logger.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
    }
};


