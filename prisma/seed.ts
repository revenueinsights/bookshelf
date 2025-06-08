import { PrismaClient, VendorType, BookCondition, QuoteStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with BookScouter-style data...');

  // Create sample vendors (like BookScouter partners)
  const vendors = await Promise.all([
    prisma.vendor.upsert({
      where: { name: 'amazon' },
      update: {},
      create: {
        name: 'amazon',
        displayName: 'Amazon Trade-In',
        website: 'https://www.amazon.com/tradein',
        type: VendorType.BUYBACK,
        averageRating: 4.2,
        totalReviews: 15420,
        processingTime: '2-3 business days',
        paymentMethods: ['Amazon Gift Card', 'Bank Transfer'],
        minOrderValue: 5.00,
        maxOrderValue: 10000.00,
      },
    }),
    
    prisma.vendor.upsert({
      where: { name: 'booksrun' },
      update: {},
      create: {
        name: 'booksrun',
        displayName: 'BooksRun',
        website: 'https://booksrun.com',
        type: VendorType.BUYBACK,
        averageRating: 4.5,
        totalReviews: 8932,
        processingTime: '1-2 business days',
        paymentMethods: ['PayPal', 'Check', 'Direct Deposit'],
        minOrderValue: 1.00,
        maxOrderValue: 5000.00,
      },
    }),
    
    prisma.vendor.upsert({
      where: { name: 'sellbackyourbook' },
      update: {},
      create: {
        name: 'sellbackyourbook',
        displayName: 'SellBackYourBook',
        website: 'https://sellbackyourbook.com',
        type: VendorType.BUYBACK,
        averageRating: 4.1,
        totalReviews: 12543,
        processingTime: '3-5 business days',
        paymentMethods: ['PayPal', 'Check'],
        minOrderValue: 10.00,
        maxOrderValue: 8000.00,
      },
    }),
    
    prisma.vendor.upsert({
      where: { name: 'valorebooks' },
      update: {},
      create: {
        name: 'valorebooks',
        displayName: 'ValoreBooks',
        website: 'https://valorebooks.com',
        type: VendorType.BUYBACK,
        averageRating: 3.9,
        totalReviews: 6721,
        processingTime: '2-4 business days',
        paymentMethods: ['PayPal', 'Check', 'Venmo'],
        minOrderValue: 5.00,
        maxOrderValue: 7500.00,
      },
    }),
    
    prisma.vendor.upsert({
      where: { name: 'textbookrush' },
      update: {},
      create: {
        name: 'textbookrush',
        displayName: 'TextbookRush',
        website: 'https://textbookrush.com',
        type: VendorType.BUYBACK,
        averageRating: 4.3,
        totalReviews: 9876,
        processingTime: '1-3 business days',
        paymentMethods: ['PayPal', 'Check', 'Direct Deposit', 'Zelle'],
        minOrderValue: 2.00,
        maxOrderValue: 6000.00,
      },
    }),
  ]);

  console.log(`✅ Created ${vendors.length} vendors`);

  // Create sample book metadata
  const bookMetadata = await Promise.all([
    prisma.bookMetadata.upsert({
      where: { isbn: '9780134685991' },
      update: {},
      create: {
        isbn: '9780134685991',
        isbn13: '9780134685991',
        title: 'Effective Java',
        subtitle: 'Best Practices for the Java Platform',
        authors: ['Joshua Bloch'],
        publisher: 'Addison-Wesley Professional',
        publishedDate: '2017-12-27',
        pageCount: 416,
        language: 'en',
        categories: ['Programming', 'Java', 'Software Development'],
        description: 'The definitive guide to Java programming from the creator of the Java platform.',
        retailPrice: 54.99,
        format: 'Paperback',
        averageRating: 4.6,
        ratingsCount: 892,
      },
    }),
    
    prisma.bookMetadata.upsert({
      where: { isbn: '9780135957059' },
      update: {},
      create: {
        isbn: '9780135957059',
        isbn13: '9780135957059',
        title: 'The Pragmatic Programmer',
        subtitle: 'Your Journey to Mastery, 20th Anniversary Edition',
        authors: ['David Thomas', 'Andrew Hunt'],
        publisher: 'Addison-Wesley Professional',
        publishedDate: '2019-09-13',
        pageCount: 352,
        language: 'en',
        categories: ['Programming', 'Software Development', 'Career'],
        description: 'A classic guide to programming craftsmanship, updated for modern developers.',
        retailPrice: 49.99,
        format: 'Paperback',
        averageRating: 4.4,
        ratingsCount: 1247,
      },
    }),
    
    prisma.bookMetadata.upsert({
      where: { isbn: '9781617294136' },
      update: {},
      create: {
        isbn: '9781617294136',
        isbn13: '9781617294136',
        title: 'Microservices Patterns',
        subtitle: 'With Examples in Java',
        authors: ['Chris Richardson'],
        publisher: 'Manning Publications',
        publishedDate: '2018-10-25',
        pageCount: 520,
        language: 'en',
        categories: ['Programming', 'Architecture', 'Microservices'],
        description: 'Learn how to build applications with the microservice architecture.',
        retailPrice: 59.99,
        format: 'Paperback',
        averageRating: 4.3,
        ratingsCount: 634,
      },
    }),
  ]);

  console.log(`✅ Created ${bookMetadata.length} book metadata entries`);

  // Create sample price quotes for each book
  const conditions = [BookCondition.NEW, BookCondition.LIKE_NEW, BookCondition.VERY_GOOD, BookCondition.GOOD];
  
  for (const book of bookMetadata) {
    for (const condition of conditions) {
      // Create quotes from different vendors with varying prices
      const basePrice = book.retailPrice ? Number(book.retailPrice) * 0.3 : 20; // 30% of retail as base
      
      for (const vendor of vendors) {
        const priceVariation = Math.random() * 0.4 + 0.8; // 80% to 120% of base price
        const conditionMultiplier = {
          [BookCondition.NEW]: 1.0,
          [BookCondition.LIKE_NEW]: 0.9,
          [BookCondition.VERY_GOOD]: 0.75,
          [BookCondition.GOOD]: 0.6,
          [BookCondition.ACCEPTABLE]: 0.4,
          [BookCondition.POOR]: 0.2,
        }[condition];
        
        const price = Math.round(basePrice * priceVariation * conditionMultiplier * 100) / 100;
        
        if (price >= 1.00) { // Only create quotes for books worth at least $1
          await prisma.priceQuote.upsert({
            where: {
              bookMetadataId_vendorId_condition: {
                bookMetadataId: book.id,
                vendorId: vendor.id,
                condition: condition,
              },
            },
            update: {},
            create: {
              bookMetadataId: book.id,
              vendorId: vendor.id,
              condition: condition,
              price: price,
              status: QuoteStatus.ACTIVE,
              totalPayout: price * 0.95, // Assume 5% processing fee
              estimatedPayout: vendor.processingTime,
            },
          });
        }
      }
    }
    
    // Create market data for each condition
    for (const condition of conditions) {
      const quotes = await prisma.priceQuote.findMany({
        where: {
          bookMetadataId: book.id,
          condition: condition,
          status: QuoteStatus.ACTIVE,
        },
      });
      
      if (quotes.length > 0) {
        const prices = quotes.map(q => Number(q.price));
        const averagePrice = prices.reduce((a, b) => a + b, 0) / prices.length;
        const highestPrice = Math.max(...prices);
        const lowestPrice = Math.min(...prices);
        
        await prisma.marketData.upsert({
          where: {
            bookMetadataId_condition: {
              bookMetadataId: book.id,
              condition: condition,
            },
          },
          update: {},
          create: {
            bookMetadataId: book.id,
            condition: condition,
            averagePrice: Math.round(averagePrice * 100) / 100,
            highestPrice: highestPrice,
            lowestPrice: lowestPrice,
            priceRange: Math.round((highestPrice - lowestPrice) * 100) / 100,
            vendorCount: quotes.length,
            demandScore: Math.random() * 100, // Random demand score for demo
          },
        });
      }
    }
  }

  console.log('✅ Created price quotes and market data');
  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
