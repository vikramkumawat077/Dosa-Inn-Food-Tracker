'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useMenu } from '@/lib/menuContext';
import styles from './page.module.css';

type TimeRange = 'today' | 'week' | 'month' | 'year' | 'all' | 'custom';

export default function AnalyticsPage() {
    const { orders } = useMenu();
    const [timeRange, setTimeRange] = useState<TimeRange>('today');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    // --- Date Helpers ---
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const getWeekStart = () => {
        const d = new Date(todayStart);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
        return new Date(d.setDate(diff));
    };

    const getMonthStart = () => new Date(now.getFullYear(), now.getMonth(), 1);
    const getYearStart = () => new Date(now.getFullYear(), 0, 1);

    // --- Filtering Logic ---
    const filteredOrders = useMemo(() => {

        return orders.filter(order => {
            const orderDate = new Date(order.timestamp);

            if (timeRange === 'today') {
                const now = new Date();
                return orderDate.getDate() === now.getDate() &&
                    orderDate.getMonth() === now.getMonth() &&
                    orderDate.getFullYear() === now.getFullYear();
            }
            if (timeRange === 'week') return orderDate >= getWeekStart();
            if (timeRange === 'month') return orderDate >= getMonthStart();
            if (timeRange === 'year') return orderDate >= getYearStart();
            if (timeRange === 'custom') {
                if (!customStart) return true;
                const [y, m, d] = customStart.split('-').map(Number);
                const start = new Date(y, m - 1, d);

                const end = customEnd ? new Date(customEnd) : new Date();
                if (customEnd) {
                    const [ey, em, ed] = customEnd.split('-').map(Number);
                    end.setFullYear(ey, em - 1, ed);
                }
                end.setHours(23, 59, 59, 999);
                return orderDate >= start && orderDate <= end;
            }
            return true; // 'all'
        });
    }, [orders, timeRange, customStart, customEnd]);

    // --- KPI Calculations ---
    const kpis = useMemo(() => {
        const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        const totalOrders = filteredOrders.length;
        const aov = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

        // Busiest Hour
        const hourCounts: Record<number, number> = {};
        filteredOrders.forEach(o => {
            const h = new Date(o.timestamp).getHours();
            hourCounts[h] = (hourCounts[h] || 0) + 1;
        });
        const busiestHour24 = Object.keys(hourCounts).reduce((a, b) =>
            hourCounts[parseInt(a)] > hourCounts[parseInt(b)] ? a : b, '0'
        );
        const busyHour = parseInt(busiestHour24);
        const busiestHourStr = `${busyHour % 12 || 12} ${busyHour >= 12 ? 'PM' : 'AM'}`;

        return { totalRevenue, totalOrders, aov, busiestHourStr, maxOrders: Math.max(...Object.values(hourCounts), 0) };
    }, [filteredOrders]);

    // --- Top Sellers ---
    const topSellers = useMemo(() => {
        const itemCounts: Record<string, number> = {};
        filteredOrders.forEach(order => {
            order.items.forEach(item => {
                itemCounts[item.menuItem.name] = (itemCounts[item.menuItem.name] || 0) + item.quantity;
            });
        });
        return Object.entries(itemCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));
    }, [filteredOrders]);

    // --- Order Type Split ---
    const typeSplit = useMemo(() => {
        const dineIn = filteredOrders.filter(o => o.orderType === 'dine-in').length;
        const preorder = filteredOrders.filter(o => o.orderType === 'preorder').length;
        const total = dineIn + preorder || 1;
        const dineInPerc = Math.round((dineIn / total) * 100);
        return { dineIn, preorder, dineInPerc };
    }, [filteredOrders]);

    // --- Revenue Chart Data (Grouped by Day/Month) ---
    const chartData = useMemo(() => {
        const data: Record<string, number> = {};
        const orderedLabels: string[] = [];

        // 1. Initialize empty slots based on range
        if (timeRange === 'today') {
            for (let i = 0; i < 24; i++) {
                const hour = i % 12 || 12;
                const ampm = i < 12 ? 'AM' : 'PM';
                const label = `${hour} ${ampm}`;
                orderedLabels.push(label);
                data[label] = 0;
            }
        } else if (timeRange === 'week') {
            const current = getWeekStart();
            for (let i = 0; i < 7; i++) {
                const dateKey = new Date(current);
                dateKey.setDate(current.getDate() + i);
                const label = `${dateKey.toLocaleDateString('en-US', { weekday: 'short' })} ${dateKey.getDate()}`;
                orderedLabels.push(label);
                data[label] = 0;
            }
        } else if (timeRange === 'month') {
            const now = new Date();
            const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            for (let i = 1; i <= daysInMonth; i++) {
                const label = i.toString();
                orderedLabels.push(label);
                data[label] = 0;
            }
        } else if (timeRange === 'year') {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            months.forEach(m => {
                orderedLabels.push(m);
                data[m] = 0;
            });
        }

        // 2. Populate with data
        filteredOrders.forEach(order => {
            const d = new Date(order.timestamp);
            let key = '';

            if (timeRange === 'today') {
                const h = d.getHours();
                const hour = h % 12 || 12;
                const ampm = h < 12 ? 'AM' : 'PM';
                key = `${hour} ${ampm}`;
            } else if (timeRange === 'week') {
                key = `${d.toLocaleDateString('en-US', { weekday: 'short' })} ${d.getDate()}`;
            } else if (timeRange === 'month') {
                key = d.getDate().toString();
            } else if (timeRange === 'year') {
                key = d.toLocaleDateString('en-US', { month: 'short' });
            } else {
                // Custom/All: generate partial keys if not pre-filled
                key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                if (data[key] === undefined) {
                    orderedLabels.push(key);
                    data[key] = 0;
                }
            }

            if (data[key] !== undefined) {
                data[key] += order.totalAmount;
            }
        });

        // 3. Construct Final Data Array
        const maxVal = Math.max(...Object.values(data), 1);
        return orderedLabels.map(label => ({
            label,
            value: data[label],
            heightPerc: (data[label] / maxVal) * 100
        }));
    }, [filteredOrders, timeRange]);


    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <Link href="/admin" className={styles.backLink}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        Back
                    </Link>
                    <h1 className={styles.title}>Analytics Dashboard</h1>
                </div>
            </div>

            {/* Controls */}
            <div className={styles.controls}>
                <div className={styles.timeTabs}>
                    {(['today', 'week', 'month', 'year', 'all', 'custom'] as const).map(range => (
                        <button
                            key={range}
                            className={`${styles.tab} ${timeRange === range ? styles.activeTab : ''}`}
                            onClick={() => setTimeRange(range)}
                        >
                            {range.charAt(0).toUpperCase() + range.slice(1)}
                        </button>
                    ))}
                </div>

                {timeRange === 'custom' && (
                    <div className={styles.datePicker}>
                        <div className={styles.dateInputGroup}>
                            <span className={styles.dateLabel}>From</span>
                            <input
                                type="date"
                                value={customStart}
                                onChange={(e) => setCustomStart(e.target.value)}
                                className={styles.dateInput}
                            />
                        </div>
                        <div className={styles.dateInputGroup}>
                            <span className={styles.dateLabel}>To</span>
                            <input
                                type="date"
                                value={customEnd}
                                onChange={(e) => setCustomEnd(e.target.value)}
                                className={styles.dateInput}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Dashboard Content */}
            <div className={styles.dashboard}>

                {/* KPI Cards */}
                <div className={styles.kpiGrid}>
                    <div className={styles.kpiCard}>
                        <span className={styles.kpiLabel}>Total Revenue</span>
                        <span className={styles.kpiValue}>₹{kpis.totalRevenue.toLocaleString()}</span>
                    </div>
                    <div className={styles.kpiCard}>
                        <span className={styles.kpiLabel}>Total Orders</span>
                        <span className={styles.kpiValue}>{kpis.totalOrders}</span>
                    </div>
                    <div className={styles.kpiCard}>
                        <span className={styles.kpiLabel}>Avg Order Value</span>
                        <span className={styles.kpiValue}>₹{kpis.aov}</span>
                    </div>
                    <div className={styles.kpiCard}>
                        <span className={styles.kpiLabel}>Busiest Hour</span>
                        <span className={styles.kpiValue}>{Number(kpis.busiestHourStr.split(' ')[0]) === 0 ? '-' : kpis.busiestHourStr}</span>
                    </div>
                </div>

                {/* Revenue Chart */}
                <div className={styles.chartSection}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Revenue Trend</h2>
                    </div>
                    {chartData.length > 0 ? (
                        <div className={styles.chartContainer}>
                            {chartData.map((bar, i) => (
                                <div key={i} className={styles.barGroup}>
                                    <div
                                        className={styles.bar}
                                        style={{ height: `${bar.heightPerc}%` }}
                                    >
                                        <div className={styles.barTooltip}>₹{bar.value}</div>
                                    </div>
                                    <span className={styles.barLabel}>{bar.label}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '40px' }}>
                            No data for selected period
                        </p>
                    )}
                </div>

                <div className={styles.splitGrid}>
                    {/* Top Sellers */}
                    <div className={styles.chartSection}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>Top Selling Items</h2>
                        </div>
                        <div className={styles.topList}>
                            {topSellers.length > 0 ? topSellers.map((item, index) => (
                                <div key={item.name} className={styles.topItem}>
                                    <div className={styles.rank}>{index + 1}</div>
                                    <div className={styles.itemName}>{item.name}</div>
                                    <div className={styles.itemCount}>{item.count} sold</div>
                                </div>
                            )) : (
                                <p style={{ color: 'var(--color-text-muted)' }}>No sales yet</p>
                            )}
                        </div>
                    </div>

                    {/* Order Type Split */}
                    <div className={styles.chartSection}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>Order Types</h2>
                        </div>
                        <div className={styles.typeBreakdown}>
                            <div
                                className={styles.typeChart}
                                style={{
                                    background: `conic-gradient(var(--color-primary) ${typeSplit.dineInPerc}%, #ff9800 0)`
                                } as React.CSSProperties}
                            />
                            <div className={styles.typeLegend}>
                                <div className={styles.legendItem}>
                                    <div className={styles.dot} style={{ backgroundColor: 'var(--color-primary)' }} />
                                    <span>Dine-in ({typeSplit.dineIn})</span>
                                </div>
                                <div className={styles.legendItem}>
                                    <div className={styles.dot} style={{ backgroundColor: '#ff9800' }} />
                                    <span>Preorder ({typeSplit.preorder})</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>


            </div>
        </div>
    );
}
