const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function test() {
    try {
        await prisma.$connect();
        console.log("OK DB");
    } catch (err) {
        console.error("DB ERROR:", err);
    } finally {
        await prisma.$disconnect();
    }
}

test();
