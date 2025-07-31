// app/api/batches/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/batches - Starting request');
    const session = await getServerSession(authOptions);
    console.log('📋 Session:', { user: session?.user, hasUser: !!session?.user });
    
    if (!session?.user) {
      console.log('❌ No session user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || '';
    console.log('🔍 Search query:', query);
    
    // First try to find the user by email if available
    let user;
    if (session.user.email) {
      console.log('👤 Looking up user by email:', session.user.email);
      user = await prisma.user.findUnique({
        where: { email: session.user.email }
      });
      console.log('👤 User found by email:', !!user);
    }
    
    // If user not found by email and id is available, try by id
    if (!user && session.user.id) {
      console.log('👤 Looking up user by ID:', session.user.id);
      user = await prisma.user.findUnique({
        where: { id: session.user.id }
      });
      console.log('👤 User found by ID:', !!user);
    }
    
    if (!user) {
      console.log('❌ User not found in database');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    console.log('✅ User found, ID:', user.id);
    let whereClause: any = { userId: user.id };
    
    // Add search filter if query is provided
    if (query) {
      whereClause.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
    }
    
    console.log('🔍 Fetching batches with where clause:', whereClause);
    const batches = await prisma.batch.findMany({
      where: whereClause,
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { books: true },
        },
      },
    });
    
    console.log('📦 Found batches:', batches.length);
    return NextResponse.json(batches);
  } catch (error) {
    console.error('Error fetching batches:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch batches',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}


export async function POST(request: NextRequest) {
  console.log("POST /api/batches endpoint hit");
  try {
    console.log("Getting server session...");
    const session = await getServerSession(authOptions);
    
    console.log("Session:", JSON.stringify(session, null, 2));
    
    // Test database connection
    console.log("Testing database connection...");
    await prisma.$queryRaw`SELECT 1`;
    console.log("Database connection successful");
    
    if (!session?.user) {
      console.log("No user in session:", session);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { name, description } = body;
    
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Batch name is required' }, { status: 400 });
    }
    
    // Find user by email
    let user = null;
    if (session.user.email) {
      console.log("Looking up user by email:", session.user.email);
      user = await prisma.user.findUnique({
        where: { email: session.user.email }
      });
    }
    
    // If not found by email, try by id
    if (!user && session.user.id) {
      console.log("Looking up user by ID:", session.user.id);
      user = await prisma.user.findUnique({
        where: { id: session.user.id }
      });
    }
    
    if (!user) {
      console.log("User not found with provided session data");
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    console.log("Creating batch for user ID:", user.id);
    
    try {
      // Create the batch with proper default values
      const batch = await prisma.batch.create({
        data: {
          name,
          description: description || null,
          userId: user.id,
          greenCount: 0,
          yellowCount: 0,
          redCount: 0,
          totalBooks: 0,
          totalValue: 0,
          averagePercent: 0,
        },
      });
      
      console.log("Batch created successfully:", batch.id);
      return NextResponse.json(batch, { status: 201 });
    } catch (createError) {
      console.error("Error creating batch in database:", createError);
      return NextResponse.json({ 
        error: 'Failed to create batch in database', 
        details: createError instanceof Error ? createError.message : 'Unknown error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in batch creation process:', error);
    return NextResponse.json({ 
      error: 'Failed to create batch', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}