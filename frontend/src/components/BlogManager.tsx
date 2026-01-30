import React, { useEffect, useMemo, useState } from 'react';
import { BlogPost, BlogComment, UserRole } from '../types';
import { blogService } from '../services/blogService';
import { Button } from './Button';
import { ShieldCheck, PenSquare, CheckCircle, Archive } from 'lucide-react';

type Props = {
  role: UserRole;
  onNotify: (message: string) => void;
};

const emptyForm = {
  title: '',
  excerpt: '',
  content: '',
  coverImageUrl: '',
  categories: '',
  tags: ''
};

export const BlogManager: React.FC<Props> = ({ role, onNotify }) => {
  const [myPosts, setMyPosts] = useState<BlogPost[]>([]);
  const [pendingPosts, setPendingPosts] = useState<BlogPost[]>([]);
  const [pendingComments, setPendingComments] = useState<BlogComment[]>([]);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const isAdmin = role === UserRole.ADMIN;
  const canWrite = role === UserRole.ADMIN || role === UserRole.ORGANIZER;

  const parseList = (value: string) =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

  const loadData = async () => {
    setLoading(true);
    try {
      const mine = await blogService.listMine();
      setMyPosts(mine);
      if (isAdmin) {
        const [pending, comments] = await Promise.all([
          blogService.listPending(),
          blogService.listPendingComments()
        ]);
        setPendingPosts(pending);
        setPendingComments(comments);
      }
    } catch (error: any) {
      onNotify(error?.message || 'No se pudo cargar el panel de blog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canWrite) {
      loadData();
    }
  }, [role]);

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      excerpt: post.excerpt ?? '',
      content: post.content,
      coverImageUrl: post.cover_image_url ?? '',
      categories: (post.categories || []).map((c) => c.name).join(', '),
      tags: (post.tags || []).map((t) => t.name).join(', ')
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCoverImageChange = (file?: File) => {
    if (!file) {
      setFormData({ ...formData, coverImageUrl: '' });
      return;
    }
    if (!file.type.startsWith('image/')) {
      onNotify('Selecciona un archivo de imagen válido.');
      return;
    }
    const maxSizeMb = 2;
    if (file.size > maxSizeMb * 1024 * 1024) {
      onNotify(`La imagen debe ser menor a ${maxSizeMb}MB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      setFormData({ ...formData, coverImageUrl: result });
    };
    reader.onerror = () => {
      onNotify('No se pudo cargar la imagen.');
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setEditingPost(null);
    setFormData({ ...emptyForm });
    setFormErrors([]);
  };

  const handleSubmit = async () => {
    const errors: string[] = [];
    if (formData.title.trim().length < 3) {
      errors.push('El título debe tener al menos 3 caracteres.');
    }
    if (formData.excerpt.trim().length > 0 && formData.excerpt.trim().length < 10) {
      errors.push('El extracto debe tener al menos 10 caracteres si se completa.');
    }
    if (formData.content.trim().length < 20) {
      errors.push('El contenido debe tener al menos 20 caracteres.');
    }
    if (formData.coverImageUrl.trim().length > 0) {
      const isDataUrl = formData.coverImageUrl.startsWith('data:image/');
      const isHttpUrl = /^https?:\/\//i.test(formData.coverImageUrl);
      if (!isDataUrl && !isHttpUrl) {
        errors.push('La imagen de portada debe ser una URL válida o una imagen subida.');
      }
    }
    setFormErrors(errors);
    if (errors.length > 0) {
      return;
    }
    const payload = {
      title: formData.title.trim(),
      excerpt: formData.excerpt.trim() || undefined,
      content: formData.content.trim(),
      coverImageUrl: formData.coverImageUrl.trim() || undefined,
      categories: parseList(formData.categories),
      tags: parseList(formData.tags)
    };
    try {
      if (editingPost) {
        await blogService.update(editingPost.id, payload);
        onNotify('Artículo actualizado.');
      } else {
        await blogService.create(payload);
        onNotify('Borrador creado.');
      }
      setFormErrors([]);
      resetForm();
      await loadData();
    } catch (error: any) {
      onNotify(error?.message || 'No se pudo guardar el artículo.');
    }
  };

  const handleSubmitReview = async (postId: string) => {
    try {
      await blogService.submitReview(postId);
      onNotify('Enviado a revisión.');
      await loadData();
    } catch (error: any) {
      onNotify(error?.message || 'No se pudo enviar a revisión.');
    }
  };

  const handlePublish = async (postId: string) => {
    try {
      await blogService.publish(postId);
      onNotify('Artículo publicado.');
      await loadData();
    } catch (error: any) {
      onNotify(error?.message || 'No se pudo publicar.');
    }
  };

  const handleArchive = async (postId: string) => {
    try {
      await blogService.archive(postId);
      onNotify('Artículo archivado.');
      await loadData();
    } catch (error: any) {
      onNotify(error?.message || 'No se pudo archivar.');
    }
  };

  const handleModerateComment = async (commentId: string, approve: boolean) => {
    try {
      if (approve) {
        await blogService.approveComment(commentId);
      } else {
        await blogService.rejectComment(commentId);
      }
      onNotify(approve ? 'Comentario aprobado.' : 'Comentario rechazado.');
      await loadData();
    } catch (error: any) {
      onNotify(error?.message || 'No se pudo moderar el comentario.');
    }
  };

  const draftPosts = useMemo(
    () => myPosts.filter((post) => post.status === 'DRAFT' || post.status === 'PENDING_REVIEW'),
    [myPosts]
  );

  if (!canWrite) return null;

  return (
    <section className="space-y-8">
      <div className="glass-panel p-6 rounded-2xl border border-lp-border">
        <h4 className="text-2xl font-title font-bold text-white flex items-center gap-2">
          <PenSquare size={20} className="text-lp-accent" />
          {editingPost ? 'Editar artículo' : 'Nuevo artículo'}
        </h4>
        {formErrors.length > 0 && (
          <div className="bg-lp-error/10 border border-lp-error/40 rounded-lg px-4 py-3 text-sm text-lp-error font-body">
            {formErrors.map((err) => (
              <p key={err}>{err}</p>
            ))}
          </div>
        )}
        <div className="grid gap-4 mt-4">
          <input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Título"
            className="bg-white/90 border border-lp-border rounded-lg px-3 py-2 text-sm text-lp-navy placeholder:text-slate-500 placeholder:opacity-100 font-body"
          />
          <p className="text-[11px] text-lp-muted font-body">Mínimo 3 caracteres.</p>
          <textarea
            value={formData.excerpt}
            onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
            placeholder="Extracto breve"
            className="bg-white/90 border border-lp-border rounded-lg px-3 py-2 text-sm text-lp-navy placeholder:text-slate-500 placeholder:opacity-100 font-body min-h-[80px]"
          />
          <p className="text-[11px] text-lp-muted font-body">Opcional. Si completás: mínimo 10 caracteres.</p>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="Contenido del artículo"
            className="bg-white/90 border border-lp-border rounded-lg px-3 py-2 text-sm text-lp-navy placeholder:text-slate-500 placeholder:opacity-100 font-body min-h-[220px]"
          />
          <p className="text-[11px] text-lp-muted font-body">Mínimo 20 caracteres.</p>
          <div className="grid gap-2">
            <label className="text-xs text-lp-muted font-body">Imagen de portada</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleCoverImageChange(e.target.files?.[0])}
              className="bg-white/90 border border-lp-border rounded-lg px-3 py-2 text-sm text-lp-navy placeholder:text-slate-500 placeholder:opacity-100 font-body"
            />
            <input
              value={formData.coverImageUrl}
              onChange={(e) => setFormData({ ...formData, coverImageUrl: e.target.value })}
              placeholder="O pegá una URL de imagen"
              className="bg-white/90 border border-lp-border rounded-lg px-3 py-2 text-sm text-lp-navy placeholder:text-slate-500 placeholder:opacity-100 font-body"
            />
            <p className="text-[11px] text-lp-muted font-body">Opcional. Si pegás URL, debe ser válida.</p>
            {formData.coverImageUrl && (
              <div className="rounded-xl border border-lp-border bg-lp-bg/40 p-2">
                <img
                  src={formData.coverImageUrl}
                  alt="Vista previa portada"
                  className="w-full max-h-56 object-cover rounded-lg"
                />
              </div>
            )}
          </div>
          <input
            value={formData.categories}
            onChange={(e) => setFormData({ ...formData, categories: e.target.value })}
            placeholder="Categorías (separadas por coma)"
            className="bg-white/90 border border-lp-border rounded-lg px-3 py-2 text-sm text-lp-navy placeholder:text-slate-500 placeholder:opacity-100 font-body"
          />
          <input
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            placeholder="Tags (separados por coma)"
            className="bg-white/90 border border-lp-border rounded-lg px-3 py-2 text-sm text-lp-navy placeholder:text-slate-500 placeholder:opacity-100 font-body"
          />
        </div>
        <div className="flex flex-wrap gap-3 mt-4">
          <Button variant="primary" onClick={handleSubmit} className="font-body">
            {editingPost ? 'Guardar cambios' : 'Guardar borrador'}
          </Button>
          {editingPost && (
            <Button variant="ghost" onClick={resetForm} className="font-body">
              Cancelar edición
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-xl font-title text-white">Tus borradores</h4>
        {loading && <p className="text-sm text-lp-muted font-body">Cargando...</p>}
        {draftPosts.length === 0 && !loading && (
          <p className="text-sm text-lp-muted font-body">No tienes borradores activos.</p>
        )}
        {draftPosts.map((post) => (
          <div key={post.id} className="glass-panel p-4 rounded-xl border border-lp-border flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-white font-body font-semibold">{post.title}</p>
              <p className="text-xs text-lp-muted font-body">{post.status}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" onClick={() => handleEdit(post)} className="font-body">
                Editar
              </Button>
              {post.status === 'DRAFT' && role === UserRole.ORGANIZER && (
                <Button variant="primary" onClick={() => handleSubmitReview(post.id)} className="font-body">
                  Enviar a revisión
                </Button>
              )}
              {post.status === 'DRAFT' && role === UserRole.ADMIN && (
                <Button variant="primary" onClick={() => handlePublish(post.id)} className="font-body">
                  Publicar
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {isAdmin && (
        <>
          <div className="space-y-4">
            <h4 className="text-xl font-title text-white flex items-center gap-2">
              <ShieldCheck size={18} className="text-lp-warning" />
              Pendientes de revisión
            </h4>
            {pendingPosts.length === 0 && (
              <p className="text-sm text-lp-muted font-body">No hay artículos pendientes.</p>
            )}
            {pendingPosts.map((post) => (
              <div key={post.id} className="glass-panel p-4 rounded-xl border border-lp-border flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-white font-body font-semibold">{post.title}</p>
                  <p className="text-xs text-lp-muted font-body">{post.author_name || post.author_email}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="primary" onClick={() => handlePublish(post.id)} className="font-body">
                    <CheckCircle size={16} /> Publicar
                  </Button>
                  <Button variant="ghost" onClick={() => handleArchive(post.id)} className="font-body">
                    <Archive size={16} /> Archivar
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <h4 className="text-xl font-title text-white">Comentarios pendientes</h4>
            {pendingComments.length === 0 && (
              <p className="text-sm text-lp-muted font-body">No hay comentarios pendientes.</p>
            )}
            {pendingComments.map((comment) => (
              <div key={comment.id} className="glass-panel p-4 rounded-xl border border-lp-border">
                <p className="text-xs text-lp-muted font-body">
                  {comment.post_title || 'Post'} · {comment.author_name || comment.author_email || 'Usuario'}
                </p>
                <p className="text-sm text-white font-body mt-2">{comment.content}</p>
                <div className="flex gap-2 mt-3">
                  <Button variant="primary" onClick={() => handleModerateComment(comment.id, true)} className="font-body">
                    Aprobar
                  </Button>
                  <Button variant="ghost" onClick={() => handleModerateComment(comment.id, false)} className="font-body">
                    Rechazar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
};
