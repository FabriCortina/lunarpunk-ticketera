# 🔒 Configuración de Protección de Ramas

Esta guía explica cómo configurar las reglas de protección de ramas en GitHub para `main` y `monolith`.

## 📍 Acceso a la Configuración

1. Ve a tu repositorio: https://github.com/FabriCortina/lunarpunk-ticketera
2. Haz clic en **Settings** (Configuración)
3. En el menú lateral, haz clic en **Branches** (Ramas)
4. Haz clic en **Add rule** (Agregar regla) o **Edit** si ya existe una regla

---

## 🌟 Rama `main` (Producción)

### Configuración Recomendada:

#### 1. **Branch name pattern**
```
main
```

#### 2. **Protect matching branches** ✅
Marca esta casilla para activar la protección.

#### 3. **Require a pull request before merging**
- ✅ **Require pull request reviews before merging**
  - **Required number of approvals**: `1` o `2` (recomendado: 2 para producción)
  - ✅ **Dismiss stale pull request approvals when new commits are pushed**
  - ✅ **Require review from Code Owners** (si tienes CODEOWNERS configurado)
  - **Restrict who can dismiss pull request reviews**: Solo administradores

#### 4. **Require status checks to pass before merging**
- ✅ **Require status checks to pass before merging**
  - Si tienes CI/CD configurado, agrega los checks requeridos:
    - `build` (si tienes GitHub Actions)
    - `test` (si tienes tests)
    - `lint` (si tienes linter)
  - ✅ **Require branches to be up to date before merging**

#### 5. **Require conversation resolution before merging**
- ✅ **Require conversation resolution before merging**

#### 6. **Require signed commits** (Opcional pero recomendado)
- ✅ **Require signed commits** (requiere GPG keys configuradas)

#### 7. **Require linear history** (Opcional)
- ✅ **Require linear history** (evita merge commits, solo permite rebase)

#### 8. **Require deployments to succeed before merging** (Si usas GitHub Deployments)
- ✅ **Require deployments to succeed before merging**

#### 9. **Do not allow bypassing the above settings**
- ✅ **Do not allow bypassing the above settings** (incluso administradores deben seguir las reglas)

#### 10. **Restrict who can push to matching branches**
- ✅ **Restrict pushes that create matching branches**
- Solo permite push a: **Nadie** (solo mediante Pull Requests)

#### 11. **Allow force pushes** ❌
- ❌ **NO marcar** - Nunca permitir force push en producción

#### 12. **Allow deletions** ❌
- ❌ **NO marcar** - Nunca permitir eliminar la rama main

---

## 🏗️ Rama `monolith` (Estable/Release)

### Configuración Recomendada:

#### 1. **Branch name pattern**
```
monolith
```

#### 2. **Protect matching branches** ✅

#### 3. **Require a pull request before merging**
- ✅ **Require pull request reviews before merging**
  - **Required number of approvals**: `1` (menos estricto que main)
  - ✅ **Dismiss stale pull request approvals when new commits are pushed**

#### 4. **Require status checks to pass before merging**
- ✅ **Require status checks to pass before merging**
  - Agrega los mismos checks que en main
  - ✅ **Require branches to be up to date before merging**

#### 5. **Require conversation resolution before merging**
- ✅ **Require conversation resolution before merging**

#### 6. **Do not allow bypassing the above settings**
- ⚠️ **Opcional**: Puedes permitir que administradores bypassen (más flexible)

#### 7. **Restrict who can push to matching branches**
- ✅ **Restrict pushes that create matching branches**
- Permite push a: **Colaboradores con permisos de escritura** (o solo mediante PRs)

#### 8. **Allow force pushes** ❌
- ❌ **NO marcar** - No permitir force push

#### 9. **Allow deletions** ❌
- ❌ **NO marcar** - No permitir eliminar la rama

---

## 📝 Rama `monolithDev` (Desarrollo)

### Configuración Opcional (Menos Estricta):

#### 1. **Branch name pattern**
```
monolithDev
```

#### 2. **Protect matching branches** ✅ (Opcional)

#### 3. **Require a pull request before merging**
- ⚠️ **Opcional**: Puedes requerir PRs pero con menos restricciones

#### 4. **Restrict who can push to matching branches**
- ⚠️ **Opcional**: Puedes permitir push directo para desarrollo rápido

#### 5. **Allow force pushes** ⚠️
- ⚠️ **Opcional**: Puedes permitir force push solo para administradores si es necesario

---

## 🎯 Resumen de Configuraciones por Rama

| Configuración | `main` | `monolith` | `monolithDev` |
|--------------|--------|------------|---------------|
| Require PR | ✅ Sí (2 aprobaciones) | ✅ Sí (1 aprobación) | ⚠️ Opcional |
| Require Status Checks | ✅ Sí | ✅ Sí | ⚠️ Opcional |
| Require Reviews | ✅ Sí | ✅ Sí | ❌ No |
| Allow Force Push | ❌ No | ❌ No | ⚠️ Solo admins |
| Allow Deletions | ❌ No | ❌ No | ⚠️ Solo admins |
| Restrict Push | ✅ Solo PRs | ✅ Solo PRs | ⚠️ Permitir push directo |
| No Bypass | ✅ Sí | ⚠️ Opcional | ❌ No |

---

## 🔧 Pasos Detallados en GitHub

### Para `main`:

1. **Settings** → **Branches** → **Add rule**
2. **Branch name pattern**: `main`
3. Marca todas las opciones de protección mencionadas arriba
4. Haz clic en **Create** (Crear)

### Para `monolith`:

1. **Settings** → **Branches** → **Add rule**
2. **Branch name pattern**: `monolith`
3. Marca las opciones de protección (menos estrictas que main)
4. Haz clic en **Create** (Crear)

---

## 🚨 Importante

- **Nunca** permitas force push en `main` o `monolith`
- **Siempre** requiere Pull Requests para cambios en ramas protegidas
- **Considera** requerir 2 aprobaciones para `main` si trabajas en equipo
- **Configura** CI/CD antes de requerir status checks
- **Usa** CODEOWNERS para asignar revisores automáticos

---

## 📚 Recursos Adicionales

- [GitHub Docs: About protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub Docs: Requiring pull request reviews](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/managing-a-branch-protection-rule# Requiring-pull-request-reviews-before-merging)

---

**Última actualización**: Generado automáticamente para LunarPunk Ticketera
