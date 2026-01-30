import { FastifyReply, FastifyRequest } from 'fastify';
import { BlogService } from '../services/blog.service';
import { BlogCommentInput, BlogListQuery, CreateBlogPostInput, UpdateBlogPostInput } from '../schemas/blog.schema';

export class BlogController {
  constructor(private blogService: BlogService) {}

  listPublished = async (req: FastifyRequest, reply: FastifyReply) => {
    const query = req.query as BlogListQuery;
    const posts = await this.blogService.listPublished(query);
    return reply.send(posts);
  };

  getBySlug = async (req: FastifyRequest, reply: FastifyReply) => {
    const { slug } = req.params as { slug: string };
    const post = await this.blogService.getBySlug(slug);
    return reply.send(post);
  };

  listMine = async (req: FastifyRequest, reply: FastifyReply) => {
    const posts = await this.blogService.listMine(req.user!.id);
    return reply.send(posts);
  };

  create = async (req: FastifyRequest, reply: FastifyReply) => {
    const body = req.body as CreateBlogPostInput;
    const post = await this.blogService.createPost(req.user!.id, req.user!.role, body);
    return reply.status(201).send(post);
  };

  update = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const body = req.body as UpdateBlogPostInput;
    const post = await this.blogService.updatePost(req.user!.id, req.user!.role, id, body);
    return reply.send(post);
  };

  submitReview = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const post = await this.blogService.submitForReview(req.user!.id, id);
    return reply.send(post);
  };

  publish = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const post = await this.blogService.publish(req.user!.id, id);
    return reply.send(post);
  };

  archive = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const post = await this.blogService.archive(req.user!.id, id);
    return reply.send(post);
  };

  addComment = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const body = req.body as BlogCommentInput;
    const comment = await this.blogService.addComment(id, req.user!.id, body.content);
    return reply.status(201).send(comment);
  };

  listApprovedComments = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const comments = await this.blogService.listApprovedComments(id);
    return reply.send(comments);
  };

  listPendingComments = async (_req: FastifyRequest, reply: FastifyReply) => {
    const comments = await this.blogService.listPendingComments();
    return reply.send(comments);
  };

  approveComment = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const comment = await this.blogService.updateCommentStatus(req.user!.id, id, 'APPROVED');
    return reply.send(comment);
  };

  rejectComment = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const comment = await this.blogService.updateCommentStatus(req.user!.id, id, 'REJECTED');
    return reply.send(comment);
  };

  addView = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    await this.blogService.addView(
      id,
      req.user?.id ?? null,
      req.ip,
      req.headers['user-agent'] ?? null
    );
    return reply.status(204).send();
  };

  listCategories = async (_req: FastifyRequest, reply: FastifyReply) => {
    const categories = await this.blogService.listCategories();
    return reply.send(categories);
  };

  listTags = async (_req: FastifyRequest, reply: FastifyReply) => {
    const tags = await this.blogService.listTags();
    return reply.send(tags);
  };
}
