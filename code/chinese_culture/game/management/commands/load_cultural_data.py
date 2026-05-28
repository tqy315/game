import json
from pathlib import Path
from django.core.management.base import BaseCommand
from game.models import CulturalKnowledge


class Command(BaseCommand):
    help = 'Load cultural knowledge data from JSON into database'

    def handle(self, *args, **options):
        json_path = Path(__file__).resolve().parent.parent.parent.parent.parent.parent / 'cultural_knowledge.json'
        # Navigate: commands -> management -> game -> chinese_culture -> code -> cultural_knowledge.json

        if not json_path.exists():
            # Try alternative path
            json_path = Path('c:/Users/34626/Desktop/课程学习/实践课/game/code/cultural_knowledge.json')
        if not json_path.exists():
            self.stderr.write(f'File not found: {json_path}')
            return

        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        created = 0
        for theme_name, items in data.items():
            for item in items:
                _, created_flag = CulturalKnowledge.objects.update_or_create(
                    theme_name=theme_name,
                    item_name=item['name'],
                    defaults={
                        'title': item['title'],
                        'content': item['content'],
                    },
                )
                if created_flag:
                    created += 1

        self.stdout.write(f'Done. Created: {created}, Total: {CulturalKnowledge.objects.count()}')
