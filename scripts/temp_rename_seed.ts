import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Renaming seed user to temporarily allow Passkey registration...');
    const user = await prisma.user.findUnique({ where: { email: 'cristiano.corrado@gmail.com' } });

    if (user) {
        await prisma.user.update({
            where: { id: user.id },
            data: { email: 'temp-seed@gmail.com' }
        });
        console.log('Successfully renamed user to temp-seed@gmail.com');
    } else {
        console.log('User not found. Maybe already renamed?');
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
