const postResolvers = require('./posts');
const userResolver = require('./users')
const commentsResolver = require('./comments');

module.exports = {
  Post: {
    likeCount: (parent) => parent.likes.length,
    commentCount: (parent) => parent.comments.length
  },
  User: {
    followersCount: (parent) => parent.followers.length
  },
  Query: {
    ...postResolvers.Query,
    ...userResolver.Query
  },
  Mutation: {
    ...userResolver.Mutation,
    ...postResolvers.Mutation,
    ...commentsResolver.Mutation
  },
  Subscription: {
    ...postResolvers.Subscription
  }
};