const {
  createAdminBlogPost,
  getAdminBlogPostById,
  listAdminBlogPosts,
  restoreAdminBlogPost,
  softDeleteAdminBlogPost,
  updateAdminBlogPost,
  uploadAdminBlogCover,
  uploadAdminBlogMedia
} = require("../../blog/blog.service");
const {
  createAdminBlogTag,
  listAdminBlogTags,
  updateAdminBlogTag
} = require("../../blog/blog-tags.service");

async function listPosts(req, res, next) {
  try {
    const posts = await listAdminBlogPosts(req.query || {});
    return res.status(200).json({
      success: true,
      message: "Admin blog posts fetched successfully.",
      data: { posts }
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
}

async function getPost(req, res, next) {
  try {
    const post = await getAdminBlogPostById(req.params.id);
    return res.status(200).json({
      success: true,
      message: "Admin blog post fetched successfully.",
      data: { post }
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
}

async function createPost(req, res, next) {
  try {
    const post = await createAdminBlogPost(req.body || {});
    return res.status(201).json({
      success: true,
      message: "Blog post created successfully.",
      data: { post }
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
}

async function updatePost(req, res, next) {
  try {
    const post = await updateAdminBlogPost(req.params.id, req.body || {});
    return res.status(200).json({
      success: true,
      message: "Blog post updated successfully.",
      data: { post }
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
}

async function deletePost(req, res, next) {
  try {
    const post = await softDeleteAdminBlogPost(req.params.id);
    return res.status(200).json({
      success: true,
      message: "Blog post deleted successfully.",
      data: { post }
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
}

async function restorePost(req, res, next) {
  try {
    const post = await restoreAdminBlogPost(req.params.id);
    return res.status(200).json({
      success: true,
      message: "Blog post restored successfully.",
      data: { post }
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
}

async function uploadCover(req, res, next) {
  try {
    const result = await uploadAdminBlogCover(req.params.id, req.file);
    return res.status(200).json({
      success: true,
      message: "Cover image uploaded successfully.",
      data: result
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
}

async function uploadMedia(req, res, next) {
  try {
    const result = await uploadAdminBlogMedia(
      req.params.id,
      req.file,
      req.body?.alt
    );
    return res.status(201).json({
      success: true,
      message: "Blog media uploaded successfully.",
      data: result
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
}

async function listTags(req, res, next) {
  try {
    const tags = await listAdminBlogTags(req.query || {});
    return res.status(200).json({
      success: true,
      message: "Admin blog tags fetched successfully.",
      data: { tags }
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
}

async function createTag(req, res, next) {
  try {
    const tag = await createAdminBlogTag(req.body || {});
    return res.status(201).json({
      success: true,
      message: "Blog tag created successfully.",
      data: { tag }
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
}

async function updateTag(req, res, next) {
  try {
    const tag = await updateAdminBlogTag(req.params.id, req.body || {});
    return res.status(200).json({
      success: true,
      message: "Blog tag updated successfully.",
      data: { tag }
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
}

module.exports = {
  createPost,
  createTag,
  deletePost,
  getPost,
  listPosts,
  listTags,
  restorePost,
  updatePost,
  updateTag,
  uploadCover,
  uploadMedia
};
