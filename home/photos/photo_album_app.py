import streamlit as st
import os
from PIL import Image, ExifTags
import shutil
import json

# 상수 정의
ALBUMS_DIR = "albums"
FAVORITES_FILE = "favorites.json"

# 유틸리티 함수들
class PhotoUtils:
    @staticmethod
    def load_favorites():
        """즐겨찾기 데이터 로드 또는 초기화"""
        default_structure = {
            "albums": {},
            "photos": {}
        }
        
        if os.path.exists(FAVORITES_FILE):
            try:
                with open(FAVORITES_FILE, 'r') as f:
                    data = json.load(f)
                # 기존 데이터에 필요한 키가 없으면 추가
                if "photos" not in data:
                    data["photos"] = {}
                if "albums" not in data:
                    data["albums"] = {}
                return data
            except Exception as e:
                print(f"즐겨찾기 파일 로드 중 오류 발생: {e}")
                return default_structure
        return default_structure

    @staticmethod
    def save_favorites(favorites):
        """즐겨찾기 데이터 저장"""
        # 저장하기 전에 필요한 키가 있는지 확인
        if "photos" not in favorites:
            favorites["photos"] = {}
        if "albums" not in favorites:
            favorites["albums"] = {}
            
        with open(FAVORITES_FILE, 'w') as f:
            json.dump(favorites, f)

    @staticmethod
    def rotate_image_if_needed(image_path):
        try:
            image = Image.open(image_path)
            try:
                for orientation in ExifTags.TAGS.keys():
                    if ExifTags.TAGS[orientation] == 'Orientation':
                        break
                exif = image._getexif()
                if exif and orientation in exif:
                    if exif[orientation] == 3:
                        image = image.rotate(180, expand=True)
                    elif exif[orientation] == 6:
                        image = image.rotate(270, expand=True)
                    elif exif[orientation] == 8:
                        image = image.rotate(90, expand=True)
            except (AttributeError, KeyError, IndexError):
                pass
            return image
        except Exception as e:
            st.error(f"이미지 처리 중 오류 발생: {e}")
            return None

class AlbumManager:
    def __init__(self):
        self.ensure_albums_directory()
        self.favorites = PhotoUtils.load_favorites()

    def ensure_albums_directory(self):
        if not os.path.exists(ALBUMS_DIR):
            os.makedirs(ALBUMS_DIR)

    def create_album_directory(self, album_name):
        album_path = os.path.join(ALBUMS_DIR, album_name)
        if not os.path.exists(album_path):
            os.makedirs(album_path)
        return album_path

    def save_uploaded_file(self, uploaded_file, album_path):
        try:
            file_path = os.path.join(album_path, uploaded_file.name)
            with open(file_path, 'wb') as f:
                f.write(uploaded_file.getbuffer())
            return True
        except Exception as e:
            st.error(f"파일 저장 중 오류 발생: {e}")
            return False

    def toggle_photo_favorite(self, album_name, photo_name):
        photo_key = f"{album_name}/{photo_name}"
        if photo_key in self.favorites["photos"]:
            del self.favorites["photos"][photo_key]
        else:
            self.favorites["photos"][photo_key] = True
        PhotoUtils.save_favorites(self.favorites)

    def is_photo_favorite(self, album_name, photo_name):
        photo_key = f"{album_name}/{photo_name}"
        return photo_key in self.favorites["photos"]

class PhotoViewer:
    def __init__(self, album_manager):
        self.album_manager = album_manager

    def show_photo_detail(self, album_name, photo_name, img_path):
        # 모달 형태로 표시
        with st.container():
            # 닫기 버튼과 즐겨찾기 버튼을 상단에 배치
            col1, col2, col3 = st.columns([1, 6, 1])
            with col1:
                if st.button("← 뒤로"):
                    st.session_state.selected_photo = None
                    st.rerun()
            with col2:
                st.subheader(photo_name)
            with col3:
                is_favorite = self.album_manager.is_photo_favorite(album_name, photo_name)
                if st.button("⭐" if is_favorite else "☆"):
                    self.album_manager.toggle_photo_favorite(album_name, photo_name)
                    st.rerun()
            
            # 이미지 표시
            img = PhotoUtils.rotate_image_if_needed(img_path)
            if img:
                st.image(img, use_column_width=True)
            else:
                st.image(img_path, use_column_width=True)

def main():
    st.title("포토 앨범 관리자")
    
    album_manager = AlbumManager()
    photo_viewer = PhotoViewer(album_manager)
    
    # 기존 앨범 목록 표시
    albums = [d for d in os.listdir(ALBUMS_DIR) if os.path.isdir(os.path.join(ALBUMS_DIR, d))]
    
    # 사이드바 구성
    st.sidebar.header("앨범 관리")
    view_mode = st.sidebar.radio("보기 모드", ["전체 앨범", "즐겨찾기"])
    
    if view_mode == "전체 앨범":
        album_list = ["새 앨범 만들기"] + albums
    else:
        album_list = ["새 앨범 만들기"] + [album for album in albums 
                                    if any(k.startswith(f"{album}/") for k in album_manager.favorites["photos"])]
    
    selected_album = st.sidebar.selectbox("앨범 선택", album_list)
    
    # 새 앨범 생성 또는 기존 앨범 선택
    if selected_album == "새 앨범 만들기":
        album_name = st.text_input("새 앨범 이름을 입력하세요")
    else:
        album_name = selected_album
        st.subheader(f"선택된 앨범: {album_name}")
    
    if album_name:
        album_path = album_manager.create_album_directory(album_name)
        
        # 파일 업로드
        uploaded_files = st.file_uploader(
            "사진을 선택하거나 드래그하세요",
            type=['png', 'jpg', 'jpeg'],
            accept_multiple_files=True,
            key=f"uploader_{album_name}"
        )
        
        if uploaded_files:
            for uploaded_file in uploaded_files:
                if album_manager.save_uploaded_file(uploaded_file, album_path):
                    st.success(f"{uploaded_file.name} 저장 완료!")

        # 현재 앨범의 사진들 표시
        if os.path.exists(album_path):
            photos = [f for f in os.listdir(album_path)
                     if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
            
            # 선택된 사진 상태 관리
            if 'selected_photo' not in st.session_state:
                st.session_state.selected_photo = None
            
            # 사진 그리드 표시
            if photos:
                cols = st.columns(3)
                for idx, photo in enumerate(photos):
                    with cols[idx % 3]:
                        img_path = os.path.join(album_path, photo)
                        img = PhotoUtils.rotate_image_if_needed(img_path)
                        if img:
                            st.image(img, width=150, use_column_width=True)
                        else:
                            st.image(img_path, width=150, use_column_width=True)
                        
                        # 버튼과 캡션을 한 줄에 표시
                        col1, col2, col3 = st.columns([2, 1, 1])
                        with col1:
                            is_favorite = album_manager.is_photo_favorite(album_name, photo)
                            st.caption(f"{'⭐ ' if is_favorite else ''}{photo}")
                        with col2:
                            if st.button("🗑️", key=f"view_{album_name}_{photo}"):
                                st.session_state.selected_photo = photo
                                st.rerun()
                        with col3:
                            if st.button("🗑️", key=f"del_{album_name}_{photo}"):
                                try:
                                    os.remove(img_path)
                                    st.success(f"✅ {photo} 삭제 완료!")
                                    st.rerun()
                                except Exception as e:
                                    st.error(f"파일 삭제 중 오류 발생: {e}")
                
                # 선택된 사진이 있으면 상세 보기 표시
                if st.session_state.selected_photo:
                    st.markdown("---")
                    photo_viewer.show_photo_detail(
                        album_name,
                        st.session_state.selected_photo,
                        os.path.join(album_path, st.session_state.selected_photo)
                    )
            else:
                st.info("앨범이 비어있습니다.")

if __name__ == "__main__":
    main() 