module.exports = {
  // Provide datasource URL at runtime for Prisma CLI (migrate deploy)
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
};
