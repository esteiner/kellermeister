import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KellermeisterService } from './KellermeisterService';
import type { CellarRepository } from '../domain/Cellar/CellarRepository';
import type { BottlesContainerRepository } from '../domain/Bottle/BottlesContainerRepository';
import type { OrderRepository } from '../domain/Order/OrderRepository';
import type { BottleFactory } from '../domain/Bottle/BottleFactory';
import type { Bottle } from '../domain/Bottle/Bottle';
import type { Cellar } from '../domain/Cellar/Cellar';
import type { Order } from '../domain/Order/Order';
import type { Product } from '../domain/Product/Product';

// ---------------------------------------------------------------------------
// Helpers to build lightweight mock objects without Soukai infrastructure
// ---------------------------------------------------------------------------

function makeProduct(name: string, id = `http://example.com/products/${name}`): Product {
    return { id, name } as unknown as Product;
}

function makeBottle(productName: string, cellarId: string, productId?: string): Bottle {
    return {
        product: makeProduct(productName, productId ?? `http://example.com/products/${productName}`),
        cellar: cellarId,
        id: `http://example.com/bottles/${productName}-${Math.random()}`,
    } as unknown as Bottle;
}

function makeCellar(id: string, name = 'Test'): Cellar {
    return { id, name } as unknown as Cellar;
}

function makeOrder(orderDate?: Date): Order {
    return { orderDate } as unknown as Order;
}

// ---------------------------------------------------------------------------
// Mock factories
// ---------------------------------------------------------------------------

function makeMockCellarRepo(): CellarRepository {
    return {
        fetchCellars: vi.fn().mockResolvedValue([]),
        fetchCellarById: vi.fn(),
        fetchCellarForCellarwork: vi.fn(),
        fetchCellarForAltglass: vi.fn(),
        createCellar: vi.fn(),
        deleteCellar: vi.fn(),
        getAltglassId: vi.fn().mockReturnValue('http://example.com/cellars/altglass#it'),
        getCellarWorkId: vi.fn().mockReturnValue('http://example.com/cellars/cellarWork#it'),
        isVisible: vi.fn().mockReturnValue(true),
    } as unknown as CellarRepository;
}

function makeMockBottlesRepo(bottles: Bottle[] = []): BottlesContainerRepository {
    return {
        fetchBottlesContainer: vi.fn().mockResolvedValue({
            bottles,
            isDirty: () => false,
            save: vi.fn(),
        }),
    } as unknown as BottlesContainerRepository;
}

function makeMockOrderRepo(orders: Order[] = []): OrderRepository {
    return {
        fetchOrders: vi.fn().mockResolvedValue(orders),
        fetchUnprocessedOrders: vi.fn().mockResolvedValue([]),
        fetchOrderById: vi.fn(),
        saveProcessedOrder: vi.fn(),
    } as unknown as OrderRepository;
}

function makeMockBottleFactory(): BottleFactory {
    return {
        createFromProduct: vi.fn(),
        createFromOrderItem: vi.fn(),
    } as unknown as BottleFactory;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('KellermeisterService', () => {
    let cellarRepo: CellarRepository;
    let bottlesRepo: BottlesContainerRepository;
    let orderRepo: OrderRepository;
    let bottleFactory: BottleFactory;

    beforeEach(() => {
        cellarRepo = makeMockCellarRepo();
        bottlesRepo = makeMockBottlesRepo();
        orderRepo = makeMockOrderRepo();
        bottleFactory = makeMockBottleFactory();
    });

    function makeService(): KellermeisterService {
        return new KellermeisterService(cellarRepo, bottlesRepo, orderRepo, bottleFactory);
    }

    // -------------------------------------------------------------------------
    describe('productComparator', () => {
        it('sorts alphabetically ascending', () => {
            const service = makeService();
            const a = makeProduct('Barolo');
            const b = makeProduct('Riesling');
            expect(service.productComparator(a, b)).toBeLessThan(0);
            expect(service.productComparator(b, a)).toBeGreaterThan(0);
        });

        it('returns 0 for equal names', () => {
            const service = makeService();
            const p = makeProduct('Barolo');
            expect(service.productComparator(p, p)).toBe(0);
        });

        it('sorts a product with no name to the end', () => {
            const service = makeService();
            const named = makeProduct('Barolo');
            const unnamed = { id: 'x' } as unknown as Product;
            // named < unnamed means named comes first (returns -1)
            expect(service.productComparator(named, unnamed)).toBe(-1);
        });

        it('sorts a named product before one without a name on the other side', () => {
            const service = makeService();
            const named = makeProduct('Barolo');
            const unnamed = { id: 'x' } as unknown as Product;
            expect(service.productComparator(unnamed, named)).toBe(1);
        });
    });

    // -------------------------------------------------------------------------
    describe('ordersGroupedByMonth', () => {
        it('groups two orders in the same month under one key', async () => {
            const jan15 = makeOrder(new Date(2024, 0, 15));
            const jan28 = makeOrder(new Date(2024, 0, 28));
            orderRepo = makeMockOrderRepo([jan15, jan28]);
            const service = makeService();

            const grouped = await service.ordersGroupedByMonth();

            expect(grouped.size).toBe(1);
            expect([...grouped.values()][0]).toHaveLength(2);
        });

        it('puts orders in different months under separate keys', async () => {
            const jan = makeOrder(new Date(2024, 0, 10));
            const mar = makeOrder(new Date(2024, 2, 5));
            const dec = makeOrder(new Date(2023, 11, 20));
            orderRepo = makeMockOrderRepo([jan, mar, dec]);
            const service = makeService();

            const grouped = await service.ordersGroupedByMonth();

            expect(grouped.size).toBe(3);
        });

        it('sorts months descending (most recent first)', async () => {
            const old = makeOrder(new Date(2023, 0, 1));
            const recent = makeOrder(new Date(2024, 5, 1));
            orderRepo = makeMockOrderRepo([old, recent]);
            const service = makeService();

            const grouped = await service.ordersGroupedByMonth();
            const keys = [...grouped.keys()];

            expect(keys[0].getFullYear()).toBe(2024);
            expect(keys[1].getFullYear()).toBe(2023);
        });

        it('groups orders with no date under a single unknown-date key', async () => {
            const noDate1 = makeOrder(undefined);
            const noDate2 = makeOrder(undefined);
            orderRepo = makeMockOrderRepo([noDate1, noDate2]);
            const service = makeService();

            const grouped = await service.ordersGroupedByMonth();

            expect(grouped.size).toBe(1);
            expect([...grouped.values()][0]).toHaveLength(2);
        });

        it('normalises dates to the first of the month', async () => {
            const order = makeOrder(new Date(2024, 3, 17));
            orderRepo = makeMockOrderRepo([order]);
            const service = makeService();

            const grouped = await service.ordersGroupedByMonth();
            const key = [...grouped.keys()][0];

            expect(key.getDate()).toBe(1);
            expect(key.getMonth()).toBe(3);
            expect(key.getFullYear()).toBe(2024);
        });

        it('returns an empty map for no orders', async () => {
            orderRepo = makeMockOrderRepo([]);
            const service = makeService();

            const grouped = await service.ordersGroupedByMonth();

            expect(grouped.size).toBe(0);
        });
    });

    // -------------------------------------------------------------------------
    describe('bottlesFromCellarGroupedByProduct', () => {
        const CELLAR_ID = 'http://example.com/cellars/cave1';

        it('returns an empty map when there are no bottles', async () => {
            const service = makeService();
            const grouped = await service.bottlesFromCellarGroupedByProduct(makeCellar(CELLAR_ID));
            expect(grouped.size).toBe(0);
        });

        it('includes only bottles belonging to the given cellar', async () => {
            const OTHER_CELLAR = 'http://example.com/cellars/other';
            const bottles = [
                makeBottle('Barolo', CELLAR_ID),
                makeBottle('Riesling', OTHER_CELLAR),
            ];
            bottlesRepo = makeMockBottlesRepo(bottles);
            const service = makeService();

            const grouped = await service.bottlesFromCellarGroupedByProduct(makeCellar(CELLAR_ID));

            expect(grouped.size).toBe(1);
            expect([...grouped.values()][0][0].product.name).toBe('Barolo');
        });

        it('groups multiple bottles of the same product under one key', async () => {
            const PRODUCT_ID = 'http://example.com/products/Barolo';
            const bottles = [
                makeBottle('Barolo', CELLAR_ID, PRODUCT_ID),
                makeBottle('Barolo', CELLAR_ID, PRODUCT_ID),
                makeBottle('Barolo', CELLAR_ID, PRODUCT_ID),
            ];
            bottlesRepo = makeMockBottlesRepo(bottles);
            const service = makeService();

            const grouped = await service.bottlesFromCellarGroupedByProduct(makeCellar(CELLAR_ID));

            expect(grouped.size).toBe(1);
            expect([...grouped.values()][0]).toHaveLength(3);
        });

        it('creates separate groups for different products', async () => {
            const bottles = [
                makeBottle('Barolo', CELLAR_ID),
                makeBottle('Riesling', CELLAR_ID),
            ];
            bottlesRepo = makeMockBottlesRepo(bottles);
            const service = makeService();

            const grouped = await service.bottlesFromCellarGroupedByProduct(makeCellar(CELLAR_ID));

            expect(grouped.size).toBe(2);
        });
    });

    // -------------------------------------------------------------------------
    describe('getAllCellars', () => {
        it('delegates to the cellar repository', async () => {
            const cellars = [makeCellar('http://example.com/c1'), makeCellar('http://example.com/c2')];
            cellarRepo = { ...makeMockCellarRepo(), fetchCellars: vi.fn().mockResolvedValue(cellars) } as unknown as CellarRepository;
            const service = makeService();

            const result = await service.getAllCellars();

            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('http://example.com/c1');
        });
    });

    // -------------------------------------------------------------------------
    describe('getAltglassId / getCellarWorkId', () => {
        it('returns the altglass ID from the repository', () => {
            const service = makeService();
            expect(service.getAltglassId()).toBe('http://example.com/cellars/altglass#it');
        });

        it('returns the cellarwork ID from the repository', () => {
            const service = makeService();
            expect(service.getCellarWorkId()).toBe('http://example.com/cellars/cellarWork#it');
        });
    });
});
