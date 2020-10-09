const debug = require("debug")("common");

exports.getAuthors = async (pool, {id, limit, offset}) => {
    debug(`getAuthors | id => ${id}`);
    let sql = `SELECT * FROM authors`;
    if (id) sql = `${sql} WHERE id=${id}`;
    sql = `${sql} ORDER by first_name, last_name`;
    if (limit) sql = `${sql} LIMIT ${limit}`;
    if (offset) sql = `${sql} OFFSET id=${id}`;
    return await pool.query(sql);
} // getAuthors ...

exports.getAuthorsCount = async (pool) => {
    debug(`getAuthorsCount`);
    return await pool.query(`SELECT count(*) AS count FROM authors`);
} // getAuthorsCount ...

exports.getPosts = async (pool, {id, limit, offset}) => {
    debug(`getPosts | id => ${id}`);
    let sql = `SELECT * FROM posts`;
    if (id) sql = `${sql} WHERE id=${id}`;
    if (limit) sql = `${sql} LIMIT ${limit}`;
    if (offset) sql = `${sql} OFFSET id=${id}`;
    return await pool.query(sql);
} // getPosts ...

exports.getPostsCount = async (pool) => {
    debug(`getPostsCount`);
    return await pool.query(`SELECT count(*) AS count FROM posts`);
} // getPostsCount ...

exports.getPostsByAuthor = async (pool, authorId) => {
    debug(`getPostsByAuthor | authorId => ${authorId}`);
    return await pool.query(`SELECT * FROM posts WHERE author_id=${authorId}`);
}

exports.getPostsByAuthorCount = async (pool, authorId) => {
    debug(`getPostsByAuthorCount | authorId => ${authorId}`);
    return await pool.query(`SELECT count(*) AS count FROM posts WHERE author_id=${authorId}`);
}

exports.newPost = async (pool, post) => {
    const sql = `INSERT INTO posts (author_id, title, description, content, \`date\`) VALUES(${post.author_id}, '${post.title}', '${post.description}', '${post.content}', CURRENT_DATE());`;
    // console.log(`newPost | sql => ${sql}`);
    const r0 = await pool.query(sql);
    // console.log(`newPost | r0 =>`, r0);
    return await r0.insertId;
} // newPost ...