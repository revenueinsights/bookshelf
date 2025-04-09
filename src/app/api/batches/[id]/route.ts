// app/api/batches/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';

// GET /api/batches/[id] - Get a specific batch with its books
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const batchId = params.id;
  
  try {
    const batch = await prisma.batch.findUnique({
      where: {
        id: batchId,
        userId: session.user.id,
      },
      include: {
        books: true,
      },
    });
    
    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }
    
    return NextResponse.json(batch);
  } catch (error) {
    console.error('Error fetching batch:', error);
    return NextResponse.json({ error: 'Failed to fetch batch' }, { status: 500 });
  }
}

// PATCH /api/batches/[id] - Update a batch
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const batchId = params.id;
  
  try {
    const body = await request.json();
    const { name, description } = body;
    
    // Check if batch exists and belongs to user
    const existingBatch = await prisma.batch.findUnique({
      where: {
        id: batchId,
        userId: session.user.id,
      },
    });
    
    if (!existingBatch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }
    
    // Update the batch
    const updatedBatch = await prisma.batch.update({
      where: { id: batchId },
      data: {
        name: name !== undefined ? name : undefined,
        description: description !== undefined ? description : undefined,
      },
    });
    
    return NextResponse.json(updatedBatch);
  } catch (error) {
    console.error('Error updating batch:', error);
    return NextResponse.json({ error: 'Failed to update batch' }, { status: 500 });
  }
}

// DELETE /api/batches/[id] - Delete a batch
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const batchId = params.id;
  
  try {
    // Check if batch exists and belongs to user
    const existingBatch = await prisma.batch.findUnique({
      where: {
        id: batchId,
        userId: session.user.id,
      },
    });
    
    if (!existingBatch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }
    
    // Delete the batch
    await prisma.batch.delete({
      where: { id: batchId },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting batch:', error);
    return NextResponse.json({ error: 'Failed to delete batch' }, { status: 500 });
  }
}