import time
import json
import hmac
import hashlib
import requests
from typing import Dict, List, Optional, Any, Union
import ccxt

class TradeOgre(ccxt.Exchange):
    """
    Custom implementation of the TradeOgre exchange API
    """
    id = 'tradeogre'
    name = 'TradeOgre'
    countries = ['US']
    rateLimit = 1000
    has = {
        'CORS': False,
        'fetchTicker': True,
        'fetchTickers': False,
        'fetchOrderBook': True,
        'fetchTrades': False,
        'fetchBalance': True,
        'createOrder': True,
        'cancelOrder': True,
        'fetchOpenOrders': True,
        'fetchMyTrades': False,
        'fetchMarkets': True,
    }
    urls = {
        'logo': 'https://tradeogre.com/images/ogre.png',
        'api': 'https://tradeogre.com/api/v1',
        'www': 'https://tradeogre.com',
        'doc': 'https://tradeogre.com/help/api',
    }
    api = {
        'public': {
            'get': [
                'markets',
                'orders/{market}',
                'ticker/{market}',
                'history/{market}',
            ],
        },
        'private': {
            'get': [
                'account/balances',
                'account/order/{uuid}',
                'account/orders',
            ],
            'post': [
                'account/buy',
                'account/sell',
                'account/cancel',
            ],
        },
    }
    
    def __init__(self, config={}):
        super().__init__(config)
        self.markets_by_id = {}
        self.currencies_by_id = {}
    
    def sign(self, path, api='public', method='GET', params={}, headers=None, body=None):
        url = self.urls['api'] + '/' + path
        
        if api == 'private':
            self.check_required_credentials()
            auth = {'Authorization': 'Basic ' + self.apiKey + ':' + self.secret}
            headers = {**headers, **auth} if headers else auth
        
        if method == 'GET':
            if params:
                url += '?' + self.urlencode(params)
        elif method == 'POST':
            body = self.json(params)
            headers['Content-Type'] = 'application/json'
        
        return {'url': url, 'method': method, 'body': body, 'headers': headers}
    
    def handle_errors(self, code, reason, url, method, headers, body, response, request_headers, request_body):
        if response is None:
            return
        
        if 'success' in response and not response['success']:
            error = response.get('error', 'Unknown error')
            raise ccxt.ExchangeError(f"{self.id} error: {error}")
    
    async def fetch_markets(self, params={}):
        response = await self.publicGetMarkets(params)
        result = []
        
        for market_id, data in response.items():
            base, quote = market_id.split('-')
            symbol = f"{base}/{quote}"
            
            result.append({
                'id': market_id,
                'symbol': symbol,
                'base': base,
                'quote': quote,
                'active': True,
                'precision': {
                    'price': 8,
                    'amount': 8,
                },
                'limits': {
                    'price': {
                        'min': None,
                        'max': None,
                    },
                    'amount': {
                        'min': None,
                        'max': None,
                    },
                },
                'info': data,
            })
        
        return result
    
    async def fetch_ticker(self, symbol, params={}):
        await self.load_markets()
        market = self.market(symbol)
        response = await self.publicGetTickerMarket({'market': market['id']})
        
        return {
            'symbol': symbol,
            'timestamp': self.milliseconds(),
            'datetime': self.iso8601(self.milliseconds()),
            'high': self.safe_float(response, 'high'),
            'low': self.safe_float(response, 'low'),
            'bid': self.safe_float(response, 'bid'),
            'bidVolume': None,
            'ask': self.safe_float(response, 'ask'),
            'askVolume': None,
            'vwap': None,
            'open': None,
            'close': self.safe_float(response, 'price'),
            'last': self.safe_float(response, 'price'),
            'previousClose': None,
            'change': None,
            'percentage': None,
            'average': None,
            'baseVolume': self.safe_float(response, 'volume'),
            'quoteVolume': None,
            'info': response,
        }
    
    async def fetch_order_book(self, symbol, limit=None, params={}):
        await self.load_markets()
        market = self.market(symbol)
        response = await self.publicGetOrdersMarket({'market': market['id']})
        
        return {
            'symbol': symbol,
            'timestamp': self.milliseconds(),
            'datetime': self.iso8601(self.milliseconds()),
            'nonce': None,
            'bids': self.parse_bids_asks(response.get('buy', []), 'price', 'quantity'),
            'asks': self.parse_bids_asks(response.get('sell', []), 'price', 'quantity'),
        }
    
    def parse_bids_asks(self, bidasks, price_key='price', amount_key='quantity'):
        result = []
        for bidask in bidasks:
            price = self.safe_float(bidask, price_key)
            amount = self.safe_float(bidask, amount_key)
            result.append([price, amount])
        return result
    
    async def fetch_balance(self, params={}):
        await self.load_markets()
        response = await self.privateGetAccountBalances(params)
        
        result = {'info': response}
        
        for currency_id, balance in response.items():
            code = currency_id
            account = {
                'free': self.safe_float(balance, 'available'),
                'used': self.safe_float(balance, 'held'),
                'total': self.safe_float(balance, 'total'),
            }
            result[code] = account
        
        return result
    
    async def create_order(self, symbol, type, side, amount, price=None, params={}):
        await self.load_markets()
        market = self.market(symbol)
        
        request = {
            'market': market['id'],
            'quantity': amount,
            'price': price,
        }
        
        method = 'privatePostAccountBuy' if side == 'buy' else 'privatePostAccountSell'
        response = await getattr(self, method)(self.extend(request, params))
        
        return {
            'id': response.get('uuid'),
            'info': response,
            'symbol': symbol,
            'type': type,
            'side': side,
            'status': 'open',
        }
    
    async def cancel_order(self, id, symbol=None, params={}):
        await self.load_markets()
        
        request = {
            'uuid': id,
        }
        
        response = await self.privatePostAccountCancel(self.extend(request, params))
        
        return {
            'id': id,
            'info': response,
            'symbol': symbol,
            'status': 'canceled',
        }
    
    async def fetch_open_orders(self, symbol=None, since=None, limit=None, params={}):
        await self.load_markets()
        response = await self.privateGetAccountOrders(params)
        
        result = []
        for order_id, order in response.items():
            market_id = order.get('market')
            market = self.markets_by_id[market_id] if market_id in self.markets_by_id else None
            symbol = market['symbol'] if market else None
            
            result.append({
                'id': order_id,
                'symbol': symbol,
                'type': 'limit',
                'side': order.get('type'),
                'price': self.safe_float(order, 'price'),
                'amount': self.safe_float(order, 'quantity'),
                'filled': 0,
                'remaining': self.safe_float(order, 'quantity'),
                'status': 'open',
                'info': order,
            })
        
        return result
    
    def safe_float(self, obj, key, default=None):
        """Safely extract a float value from a dict"""
        value = obj.get(key, default)
        try:
            return float(value)
        except (ValueError, TypeError):
            return default