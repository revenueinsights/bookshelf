import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';

// GET - Retrieve current user's settings & preferences
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        bookScouterToken: true,
        bookScouterTokenExpiry: true,
        userPreferences: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update current user's settings & preferences
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      bookScouterToken,
      autoAddToInventory,
      preferredCondition,
      defaultBatchId,
      emailNotifications,
      pushNotifications,
    } = body as {
      name?: string;
      bookScouterToken?: string;
      autoAddToInventory?: boolean;
      preferredCondition?: string;
      defaultBatchId?: string | null;
      emailNotifications?: boolean;
      pushNotifications?: boolean;
    };

    // Update basic user fields
    const userData: any = {};
    if (name !== undefined) userData.name = name;
    if (bookScouterToken !== undefined) userData.bookScouterToken = bookScouterToken;

    if (Object.keys(userData).length) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: userData,
      });
    }

    // Ensure userPreferences exists
    let prefs = await prisma.userPreferences.findUnique({ where: { userId: session.user.id } });
    if (!prefs) {
      prefs = await prisma.userPreferences.create({ data: { userId: session.user.id } });
    }

    const prefsData: any = {};
    if (autoAddToInventory !== undefined) prefsData.autoAddToInventory = autoAddToInventory;
    if (preferredCondition !== undefined) prefsData.preferredCondition = preferredCondition;
    if (defaultBatchId !== undefined) prefsData.defaultBatchId = defaultBatchId === '' ? null : defaultBatchId;
    if (emailNotifications !== undefined) prefsData.emailNotifications = emailNotifications;
    if (pushNotifications !== undefined) prefsData.pushNotifications = pushNotifications;

    if (Object.keys(prefsData).length) {
      await prisma.userPreferences.update({
        where: { userId: session.user.id },
        data: prefsData,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 