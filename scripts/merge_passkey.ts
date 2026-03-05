import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Merging newly registered Passkey with original Seed data...');

    const newUser = await prisma.user.findUnique({ where: { email: 'cristiano.corrado@gmail.com' }, include: { Authenticator: true } });
    const oldUser = await prisma.user.findUnique({ where: { email: 'temp-seed@gmail.com' } });

    if (!newUser || !oldUser) {
        console.error('Could not find both users to merge.');
        return;
    }

    if (newUser.Authenticator.length === 0) {
        console.error('New user has no authenticators. Did they register a Passkey?');
        return;
    }

    // Move the Account & Authenticator to the old user
    await prisma.authenticator.updateMany({
        where: { userId: newUser.id },
        data: { userId: oldUser.id }
    });

    // Auth.js might also create an Account record depending on the provider specifics, move it just in case
    await prisma.account.updateMany({
        where: { userId: newUser.id },
        data: { userId: oldUser.id }
    });

    // Delete the new empty user
    await prisma.user.delete({ where: { id: newUser.id } });

    // Restore the email to the old user containing the data
    await prisma.user.update({
        where: { id: oldUser.id },
        data: { email: 'cristiano.corrado@gmail.com' }
    });

    console.log('Successfully merged Passkey! You can now log in securely with your data intact.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
