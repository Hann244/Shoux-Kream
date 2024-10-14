package com.shoux_kream.item.service;
import com.shoux_kream.category.entity.Category;
import com.shoux_kream.category.entity.CategoryRepository;
import com.shoux_kream.config.s3.S3Uploader;
import com.shoux_kream.exception.ErrorCode;
import com.shoux_kream.exception.KreamException;
import com.shoux_kream.item.dto.request.ItemSaveRequest;
import com.shoux_kream.item.dto.request.ItemUpdateRequest;
//import com.shoux_kream.item.dto.response.BrandResponse;
import com.shoux_kream.item.dto.response.ItemResponse;
import com.shoux_kream.item.dto.response.ItemUpdateResponse;
//import com.shoux_kream.item.entity.Brand;
import com.shoux_kream.item.entity.Item;
//import com.shoux_kream.item.repository.BrandRepository;
import com.shoux_kream.item.repository.ItemRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class ItemService {

    private final ItemRepository itemRepository;
//    private final BrandRepository brandRepository;
    private final CategoryRepository categoryRepository;
    private final S3Uploader s3Uploader;

    public ItemService(ItemRepository itemRepository, CategoryRepository categoryRepository, S3Uploader s3Uploader) {
        this.itemRepository = itemRepository;
//        this.brandRepository = brandRepository;
        this.categoryRepository = categoryRepository;
        this.s3Uploader = s3Uploader;
    }

    // 새로운 상품을 등록하고 저장된 상품 정보를 반환
    @Transactional
    public ItemResponse save(ItemSaveRequest itemSaveRequest,  MultipartFile imageFile) throws IOException {
//        Brand brand = findBrandById(itemSaveRequest.brandId());
//        Category category = findCategoryById(itemSaveRequest.categoryId());
//        Category category = categoryRepository.findByName("미지정")
//                .orElseThrow(() -> new RuntimeException("Default '미지정' category not found"));

        String imageKey = s3Uploader.upload(imageFile, "item-images");

        String searchKeywords = String.join(",", itemSaveRequest.searchKeywords());

        Item item = new Item(
//                brand,
                itemSaveRequest.title(),
//                category, // Category 엔티티 사용
                itemSaveRequest.manufacturer(),
                itemSaveRequest.shortDescription(),
                itemSaveRequest.detailDescription(),
                imageKey,
                itemSaveRequest.inventory(),
                itemSaveRequest.price(),
                searchKeywords
        );

        Item savedItem = itemRepository.save(item);

        return new ItemResponse(
                savedItem.getId(),
//                new BrandResponse(savedItem.getBrand().getId(), savedItem.getBrand().getTitle()),
                savedItem.getTitle(),
//                savedItem.getCategory(), // Category 엔티티 사용
                savedItem.getManufacturer(),
                savedItem.getShortDescription(),
                savedItem.getDetailDescription(),
                savedItem.getImageKey(),
                savedItem.getInventory(),
                savedItem.getPrice(),
                savedItem.getSearchKeywords()
        );
    }


    // 주어진 id에 해당하는 상품을 조회하고 dto 로 변환하여 반환
    public ItemResponse findById(Long id) {
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 상품을 찾을 수 없습니다."));
        return ItemResponse.fromEntity(item); // Entity를 ItemResponse로 변환 후 반환
    }

    // 주어진 상품 이름에 해당하는 상품을 조회하고 dto 로 변환하여 반환
    public ItemResponse findByName(String itemTitle) {
        Item item = itemRepository.findByTitle(itemTitle)
                .orElseThrow(() -> new EntityNotFoundException("상품을 찾을 수 없습니다."));
        return ItemResponse.fromEntity(item);
    }

    // 기존 상품 정보를 수정하고, 수정된 정보를 반환
    @Transactional
    public ItemUpdateResponse update(ItemUpdateRequest itemUpdateRequest) {
//        Brand brand = findBrandById(itemUpdateRequest.brandId());

        // TODO: repository query문 해결 후 활성화
        // itemRepository.updateItemInfo(itemUpdateRequest.brandId(), itemUpdateRequest.itemName(), itemUpdateRequest.color(), itemUpdateRequest.modelNumber());

        return new ItemUpdateResponse(
//                brand.getTitle(),
                itemUpdateRequest.itemName(),
                itemUpdateRequest.color(),
                itemUpdateRequest.modelNumber()
        );
    }

    // 주어진 id에 해당하는 상품을 삭제 (존재하지 않으면 예외 발생)
    @Transactional
    public void delete(Long id) {
        if (!itemRepository.existsById(id)) {
            throw new KreamException(ErrorCode.INVALID_ID);
        }
        itemRepository.deleteById(id);
    }

    // 모든 상품의 목록을 조회하고 dto 리스트로 반환
    public List<ItemResponse> findAll() {
        return itemRepository.findAll().stream()
                .map(ItemResponse::fromEntity)
                .collect(Collectors.toList());
    }

    // 주어진 id에 해당하는 브랜드를 내부적으로 조회 (없으면 예외 발생)
//    private Brand findBrandById(Long id) {
//        return brandRepository.findById(id)
//                .orElseThrow(() -> new KreamException(ErrorCode.INVALID_ID));
//    }

    // 주어진 id에 해당하는 카테고리를 내부적으로 조회 (없으면 예외 발생)
    private Category findCategoryById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new KreamException(ErrorCode.INVALID_ID));
    }

    // 주어진 id에 해당하는 상품을 내부적으로 조회 (없으면 예외 발생)
    private Item findItemById(Long id) {
        return itemRepository.findById(id)
                .orElseThrow(() -> new KreamException(ErrorCode.INVALID_ID));
    }
}
