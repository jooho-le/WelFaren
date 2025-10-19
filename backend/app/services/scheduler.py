from apscheduler.schedulers.background import BackgroundScheduler
from app.services.fss_service import fetch_fss_deposit_products
from app.db.db_conn import save_financial_products

def update_fss_data():
    data = fetch_fss_deposit_products()
    if data:
        save_financial_products(data)
        print(f"[Scheduler] FSS data updated: {len(data)} entries")

def start_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_job(update_fss_data, "interval", hours=6)
    scheduler.start()
