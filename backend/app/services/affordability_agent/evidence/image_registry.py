import pathlib

import pandas as pd


class ImageRegistry:
    def __init__(self, media_root: pathlib.Path):
        self.media_root = media_root

    def exists(self, image_id: str) -> bool:
        return self.path_for(image_id).exists()

    def path_for(self, image_id: str) -> pathlib.Path:
        return self.media_root / f"{image_id}.png"

    def audit(self, images_df: pd.DataFrame) -> dict:
        results = {
            'missing_files': [],
            'orphan_files': [],
            'duplicate_mappings': []
        }
        
        referenced_ids = set(images_df['image_id'])
        for image_id in referenced_ids:
            if not self.exists(image_id):
                results['missing_files'].append(image_id)
        
        if self.media_root.exists():
            for file in self.media_root.glob("*.png"):
                if file.stem not in referenced_ids:
                    results['orphan_files'].append(file.stem)
                    
        duplicate_ids = images_df[images_df.duplicated('image_id')]['image_id'].tolist()
        results['duplicate_mappings'] = duplicate_ids
        
        return results
