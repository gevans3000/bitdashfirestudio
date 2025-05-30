declare global {
  interface TradingViewWidgetOptions {
    symbol: string;
    interval: string;
    container_id: string;
    width: string;
    height: number;
    studies: string[];
    hide_top_toolbar: boolean;
    hide_legend: boolean;
  }

  interface TradingView {
    widget: new (options: TradingViewWidgetOptions) => void;
  }

  interface Window {
    TradingView: TradingView;
  }
}

export {};
