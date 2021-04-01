const { gql } = require('apollo-server');

module.exports = gql`
  type Comment {
    id: ID!
    body: String!
    createdAt: String!
    username: String!
  }
  type Like {
    id: ID!
    createdAt: String!
    username: String!
  }
  type Follower {
    id: ID!
    createdAt: String!
    username: String!
  }
  type Post {
    id: ID!
    body: String!
    createdAt: String!
    username: String!
    userAvatar: String!
    comments: [Comment]!
    likes: [Like]!
    likeCount: Int!
    commentCount: Int!
  }
  type User {
    id: ID!
    email: String!
    token: String!
    username: String!
    createdAt: String!
    avatar: String!
    followers: [Follower]!
    followersCount: Int!
  }
  type Rank {
    id: ID!
    username: String!
    avatar: String!
    influences: Int!
    createdAt: String!
  }
  input RegisterInput {
    username: String!
    password: String!
    confirmPassword: String!
    email: String!
  }
  type Query {
    getPosts: [Post]
    getPost(postId: ID!): Post
    getUser(username: String!): User
    getRanking: [Rank]
  }
  type Mutation {
    register(registerInput: RegisterInput): User!
    login(username: String!, password: String!): User!
    createPost(body: String!): Post!
    deletePost(postId: ID!): String!
    createComment(postId: ID!, body: String!): Post!
    deleteComment(postId: ID!, commentId: ID!): Post!
    likePost(postId: ID!): Post!
    follow(username: String!, follower: String!): User!
  }
  type Subscription {
    newPost: Post!
  }
`;