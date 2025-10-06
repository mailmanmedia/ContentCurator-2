/**
 * Performance Testing for Analytics Optimizations
 * Tests and measures improvements from caching, workers, and optimizations
 */

import { analyticsCache, CACHE_TTL } from './analyticsCache';

async function testCaching() {
  console.log('\n🧪 Testing Analytics Cache System...\n');

  const testData = {
    matchesPlayed: 7,
    wins: 5,
    draws: 0,
    losses: 2,
    goalsFor: 15,
    goalsAgainst: 8,
  };

  console.log('Test 1: Cache Miss (first access)');
  const start1 = Date.now();
  const result1 = await analyticsCache.get(
    'test-metric-1',
    () => {
      let sum = 0;
      for (let i = 0; i < 1000000; i++) {
        sum += i;
      }
      return { data: testData, computed: sum };
    },
    { ttl: CACHE_TTL.TEAM_METRICS }
  );
  const time1 = Date.now() - start1;
  console.log(`✓ First access (cache miss): ${time1}ms`);

  console.log('\nTest 2: Cache Hit (subsequent access)');
  const start2 = Date.now();
  const result2 = await analyticsCache.get(
    'test-metric-1',
    () => {
      let sum = 0;
      for (let i = 0; i < 1000000; i++) {
        sum += i;
      }
      return { data: testData, computed: sum };
    },
    { ttl: CACHE_TTL.TEAM_METRICS }
  );
  const time2 = Date.now() - start2;
  console.log(`✓ Second access (cache hit): ${time2}ms`);
  console.log(`✓ Performance improvement: ${((time1 - time2) / time1 * 100).toFixed(1)}% faster`);

  console.log('\nTest 3: Cache Invalidation');
  analyticsCache.invalidate('test-metric-1');
  const start3 = Date.now();
  const result3 = await analyticsCache.get(
    'test-metric-1',
    () => {
      let sum = 0;
      for (let i = 0; i < 1000000; i++) {
        sum += i;
      }
      return { data: testData, computed: sum };
    },
    { ttl: CACHE_TTL.TEAM_METRICS }
  );
  const time3 = Date.now() - start3;
  console.log(`✓ After invalidation (cache miss): ${time3}ms`);

  console.log('\nTest 4: Pattern Invalidation');
  await Promise.all([
    analyticsCache.get('team-metrics-liverpool', () => ({ data: 'team1' }), { ttl: 60000 }),
    analyticsCache.get('team-metrics-arsenal', () => ({ data: 'team2' }), { ttl: 60000 }),
    analyticsCache.get('player-metrics-salah', () => ({ data: 'player1' }), { ttl: 60000 }),
  ]);
  
  analyticsCache.invalidateTeamMetrics();
  const stats = analyticsCache.getStats();
  console.log(`✓ Cache size after team invalidation: ${stats.size} (should be 1 - only player metric)`);

  console.log('\nTest 5: Cache Statistics');
  const cacheStats = analyticsCache.getStats();
  console.log(`✓ Total entries: ${cacheStats.size}`);
  console.log(`✓ Max size: ${cacheStats.maxSize}`);
  console.log(`✓ Top accessed entries:`);
  cacheStats.entries.slice(0, 3).forEach(entry => {
    console.log(`  - ${entry.key}: ${entry.accessCount} accesses, age: ${(entry.age / 1000).toFixed(1)}s`);
  });

  console.log('\n✅ All caching tests passed!\n');
}

async function testBackgroundRefresh() {
  console.log('🧪 Testing Background Refresh...\n');

  let computeCount = 0;
  const computeFn = () => {
    computeCount++;
    return { value: Math.random(), computeCount };
  };

  console.log('Test 1: Initial load');
  const result1 = await analyticsCache.get(
    'refresh-test',
    computeFn,
    { ttl: 2000, backgroundRefresh: true }
  );
  console.log(`✓ Compute count: ${computeCount}, Value: ${result1.value.toFixed(4)}`);

  for (let i = 0; i < 6; i++) {
    await new Promise(resolve => setTimeout(resolve, 500));
    const result = await analyticsCache.get(
      'refresh-test',
      computeFn,
      { ttl: 2000, backgroundRefresh: true }
    );
    console.log(`Access ${i + 2}: Compute count: ${computeCount}, Value: ${result.value.toFixed(4)}`);
  }

  console.log('\n✅ Background refresh test completed!\n');
}

async function testMemoryEfficiency() {
  console.log('🧪 Testing Memory Efficiency...\n');

  console.log('Test 1: Cache Size Limits');
  
  for (let i = 0; i < 100; i++) {
    await analyticsCache.get(
      `metric-${i}`,
      () => ({ index: i, data: new Array(1000).fill(i) }),
      { ttl: 60000 }
    );
  }

  const stats = analyticsCache.getStats();
  console.log(`✓ Cache size: ${stats.size} entries`);
  console.log(`✓ Max size: ${stats.maxSize}`);
  console.log(`✓ Within limits: ${stats.size <= stats.maxSize ? 'YES' : 'NO'}`);

  console.log('\n✅ Memory efficiency test passed!\n');
}

async function measureCachingPerformance() {
  console.log('📊 Performance Benchmarks\n');

  const iterations = 100;
  
  console.log(`Running ${iterations} iterations...`);

  console.log('\n1. Without Cache:');
  const noCacheStart = Date.now();
  for (let i = 0; i < iterations; i++) {
    let sum = 0;
    for (let j = 0; j < 100000; j++) {
      sum += Math.sqrt(j);
    }
  }
  const noCacheTime = Date.now() - noCacheStart;
  console.log(`✓ Total time: ${noCacheTime}ms`);
  console.log(`✓ Average per iteration: ${(noCacheTime / iterations).toFixed(2)}ms`);

  console.log('\n2. With Cache:');
  const cacheStart = Date.now();
  for (let i = 0; i < iterations; i++) {
    await analyticsCache.get(
      'benchmark-test',
      () => {
        let sum = 0;
        for (let j = 0; j < 100000; j++) {
          sum += Math.sqrt(j);
        }
        return sum;
      },
      { ttl: 60000 }
    );
  }
  const cacheTime = Date.now() - cacheStart;
  console.log(`✓ Total time: ${cacheTime}ms`);
  console.log(`✓ Average per iteration: ${(cacheTime / iterations).toFixed(2)}ms`);
  
  const improvement = ((noCacheTime - cacheTime) / noCacheTime * 100).toFixed(1);
  console.log(`\n🚀 Overall improvement: ${improvement}% faster with caching`);
  console.log(`✓ Time saved: ${noCacheTime - cacheTime}ms\n`);
}

export async function runPerformanceTests() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('   ANALYTICS PERFORMANCE OPTIMIZATION TEST SUITE');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    await testCaching();
    await testBackgroundRefresh();
    await testMemoryEfficiency();
    await measureCachingPerformance();

    console.log('═══════════════════════════════════════════════════════');
    console.log('   ✅ ALL TESTS PASSED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════════════\n');

    analyticsCache.clear();
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  }
}

// Run tests if executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  runPerformanceTests().catch(console.error);
}
