const debug = require("debug")("graphql-middleware");
const { makeExecutableSchema } = require('graphql-tools');
const { PubSub } = require('apollo-server-express');

const schema = require('./schema');
const { Authors, Posts } = require("./resolvers");

const { getPostsByAuthor, newPost } = require("./common.js");

const pubsub = new PubSub();

// resolvers
const resolvers = {
    Query: {
        authors: async (root, params, context) => await new Authors(params, context.pool),
        posts: async (root, params, context) => await new Posts(params, context.pool),
    },
    Mutation: {
        newPost: async (root, params, context) => {
            debug(`newPost | root =>`, root);
            debug(`newPost | params =>`, params);
            const id = await newPost(context.pool, params);
            const result = { id, ...params };
            pubsub.publish("POST_ADDED", {postAdded: result});
            return result
        }
    },
    Subscription: {
        postAdded: {
          subscribe: () => pubsub.asyncIterator(["POST_ADDED"])
        }, // ticketLlamado ...newPost
    },
    Post: {
        author: async (root, params, context) => {
            debug(`Post/author | root =>`, root);
            const author = new Authors({id: root.author_id}, context.pool);
            const list = await author.list();
            return list[0];
        }
    },
    Author: {
        posts: async (root, params, context) => {
            debug(`Author/posts | root =>`, root);
            return await getPostsByAuthor(context.pool, root.id);
        }
    },

}; // root ...

module.exports = makeExecutableSchema({
    typeDefs: schema,
    resolvers
});