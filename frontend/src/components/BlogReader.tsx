import React, { useEffect, useMemo, useState } from 'react';
import { BlogPost, BlogCategory, BlogTag, UserRole } from '../types';
import { blogService } from '../services/blogService';
import { Button } from './Button';
import { Sparkles } from 'lucide-react';

type Props = {
  userRole?: UserRole;
  isAuthenticated: boolean;
};

export const BlogReader: React.FC<Props> = ({ userRole, isAuthenticated }) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentError, setCommentError] = useState<string | null>(null);

  const loadPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await blogService.listPublished({
        search: search || undefined,
        tag: filterTag || undefined,
        category: filterCategory || undefined
      });
      setPosts(data);
    } catch (err: any) {
      setError(err?.message || 'No se pudieron cargar las noticias.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    blogService.listCategories().then(setCategories).catch(() => setCategories([]));
    blogService.listTags().then(setTags).catch(() => setTags([]));
  }, []);

  useEffect(() => {
    loadPosts();
  }, [filterCategory, filterTag]);

  const handleSelectPost = async (post: BlogPost) => {
    try {
      const detail = await blogService.getBySlug(post.slug);
      setSelectedPost(detail);
      const approved = await blogService.listApprovedComments(detail.id);
      setComments(approved);
      await blogService.addView(detail.id);
    } catch (err: any) {
      setError(err?.message || 'No se pudo abrir la noticia.');
    }
  };

  const handleBack = () => {
    setSelectedPost(null);
    setComments([]);
    setCommentText('');
    setCommentError(null);
  };

  const handleAddComment = async () => {
    if (!selectedPost) return;
    if (!commentText.trim()) {
      setCommentError('Escribe un comentario antes de enviar.');
      return;
    }
    setCommentError(null);
    try {
      const comment = await blogService.addComment(selectedPost.id, commentText.trim());
      setComments((prev) => [...prev, comment]);
      setCommentText('');
    } catch (err: any) {
      setCommentError(err?.message || 'No se pudo enviar el comentario.');
    }
  };

  const headerLabel = useMemo(() => {
    if (userRole === UserRole.ADMIN) return 'Blog de la comunidad';
    if (userRole === UserRole.ORGANIZER) return 'Novedades de la comunidad';
    return 'Novedades de la comunidad';
  }, [userRole]);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-3xl font-title font-bold text-white flex items-center gap-3">
            <Sparkles className="text-lp-accent" size={22} />
            {headerLabel}
          </h3>
          <p className="text-sm text-lp-muted font-body">
            Noticias, anuncios y exploraciones del ecosistema Lunarpunk.
          </p>
        </div>
        {selectedPost && (
          <Button variant="ghost" onClick={handleBack} className="font-body">
            Volver al listado
          </Button>
        )}
      </div>

      {!selectedPost && (
        <div className="glass-panel p-4 rounded-xl border border-lp-border grid gap-3 md:grid-cols-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar noticias..."
            className="bg-lp-bg/40 border border-lp-border rounded-lg px-3 py-2 text-sm text-white font-body"
          />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-lp-bg/40 border border-lp-border rounded-lg px-3 py-2 text-sm text-white font-body"
          >
            <option value="">Todas las categorías</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
          <select
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            className="bg-lp-bg/40 border border-lp-border rounded-lg px-3 py-2 text-sm text-white font-body"
          >
            <option value="">Todos los tags</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.slug}>
                {tag.name}
              </option>
            ))}
          </select>
          <div className="md:col-span-3 flex items-center gap-3">
            <Button variant="primary" onClick={loadPosts} className="font-body">
              Buscar
            </Button>
            <span className="text-xs text-lp-muted font-body">
              {posts.length} publicaciones disponibles
            </span>
          </div>
        </div>
      )}

      {loading && <p className="text-sm text-lp-muted font-body">Cargando noticias...</p>}
      {error && <p className="text-sm text-lp-error font-body">{error}</p>}

      {!selectedPost && !loading && (
        <div className="grid gap-5">
          {posts.map((post) => (
            <article
              key={post.id}
              className="glass-panel p-6 rounded-2xl border border-lp-border hover:border-lp-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-xl font-title font-bold text-white">{post.title}</h4>
                  {post.excerpt && (
                    <p className="text-sm text-lp-muted font-body mt-2">{post.excerpt}</p>
                  )}
                </div>
                <Button variant="ghost" onClick={() => handleSelectPost(post)} className="font-body">
                  Leer
                </Button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-body text-lp-muted">
                {(post.categories || []).map((category) => (
                  <span key={category.id} className="px-2 py-1 rounded-full border border-lp-border">
                    {category.name}
                  </span>
                ))}
                {(post.tags || []).map((tag) => (
                  <span key={tag.id} className="px-2 py-1 rounded-full border border-lp-border text-lp-accent">
                    #{tag.name}
                  </span>
                ))}
              </div>
            </article>
          ))}
          {!posts.length && !loading && (
            <p className="text-sm text-lp-muted font-body">No hay noticias publicadas aún.</p>
          )}
        </div>
      )}

      {selectedPost && (
        <div className="glass-panel p-6 rounded-2xl border border-lp-border">
          <h2 className="text-3xl font-title font-bold text-white">{selectedPost.title}</h2>
          {selectedPost.excerpt && (
            <p className="text-sm text-lp-muted font-body mt-3">{selectedPost.excerpt}</p>
          )}
          <div className="mt-6 whitespace-pre-line text-sm text-lp-text font-body leading-relaxed">
            {selectedPost.content}
          </div>

          <div className="mt-6 border-t border-lp-border pt-4 space-y-4">
            <h4 className="text-lg font-title text-white">Comentarios</h4>
            {comments.length === 0 && (
              <p className="text-xs text-lp-muted font-body">Todavía no hay comentarios aprobados.</p>
            )}
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-lp-bg/40 border border-lp-border rounded-lg p-3">
                  <p className="text-xs text-lp-muted font-body">{comment.author_name || 'Usuario'}</p>
                  <p className="text-sm text-lp-text font-body mt-1">{comment.content}</p>
                </div>
              ))}
            </div>

            {isAuthenticated ? (
              <div className="space-y-2">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Escribe tu comentario..."
                  className="w-full bg-lp-bg/40 border border-lp-border rounded-lg px-3 py-2 text-sm text-white font-body min-h-[120px]"
                />
                {commentError && <p className="text-xs text-lp-error font-body">{commentError}</p>}
                <Button variant="primary" onClick={handleAddComment} className="font-body">
                  Enviar comentario
                </Button>
              </div>
            ) : (
              <p className="text-xs text-lp-muted font-body">Inicia sesión para comentar.</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
